import { useEffect, useRef, useState } from "react";
import type { Activity } from "../data/activities";
import type { CompletionScore } from "../lib/progress";
import { getVerifiedCompletion, type XAPIEventLike } from "../lib/h5p";

type Props = {
  activity: Activity;
  complete: boolean;
  onVerified: (completedAt: string, score?: CompletionScore) => void;
};

type Status = "loading" | "ready" | "verified" | "error";

export default function StandaloneH5P({ activity, complete, onVerified }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onVerifiedRef = useRef(onVerified);
  const verifiedRef = useRef(complete);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    onVerifiedRef.current = onVerified;
  }, [onVerified]);

  useEffect(() => {
    if (complete) verifiedRef.current = true;
  }, [complete]);

  useEffect(() => {
    if (activity.delivery.type !== "standalone") {
      setStatus("error");
      setErrorMsg("This activity is not configured for standalone H5P delivery.");
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let handler: ((event: unknown) => void) | null = null;

    const baseUrl = new URL(import.meta.env.BASE_URL, window.location.href);
    const contentPath = activity.delivery.contentPath;
    const h5pJsonPath = new URL(contentPath, baseUrl).href;
    const librariesPath = new URL(contentPath, baseUrl).href;
    const contentJsonPath = new URL(`${contentPath}/content`, baseUrl).href;
    const frameJs = new URL("h5p-player/frame.bundle.js", baseUrl).href;
    const frameCss = new URL("h5p-player/styles/h5p.css", baseUrl).href;
    const xAPIObjectIRI = new URL(`activities/${activity.id}`, baseUrl).href;

    if (!window.H5PStandalone?.H5P) {
      setStatus("error");
      setErrorMsg("H5P Standalone player failed to load.");
      return;
    }

    setStatus("loading");

    new window.H5PStandalone.H5P(container, {
      h5pJsonPath,
      librariesPath,
      contentJsonPath,
      frameJs,
      frameCss,
      reportingIsEnabled: true,
      xAPIObjectIRI,
      frame: false,
      copyright: false,
      export: false,
      embed: false,
      fullScreen: true,
    })
      .then(() => {
        if (cancelled) return;
        const dispatcher = window.H5P?.externalDispatcher;
        if (!dispatcher) {
          setStatus("error");
          setErrorMsg("H5P xAPI dispatcher was not exposed.");
          return;
        }
        handler = (event: unknown) => {
          if (cancelled || verifiedRef.current) return;
          const completion = getVerifiedCompletion(event as XAPIEventLike);
          if (completion) {
            verifiedRef.current = true;
            const score: CompletionScore | undefined =
              completion.raw !== undefined && completion.max !== undefined
                ? { raw: completion.raw, max: completion.max }
                : undefined;
            onVerifiedRef.current(new Date().toISOString(), score);
            setStatus("verified");
          }
        };
        dispatcher.on("xAPI", handler);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setErrorMsg(error instanceof Error ? error.message : String(error));
      });

    return () => {
      cancelled = true;
      const dispatcher = window.H5P?.externalDispatcher;
      if (dispatcher && handler) {
        dispatcher.off("xAPI", handler);
      }
      if (container) container.innerHTML = "";
    };
  }, [activity]);

  if (activity.delivery.type !== "standalone") {
    return (
      <div className="automatic-checkpoint automatic-checkpoint-error">
        <p className="automatic-checkpoint-error-text">
          This activity is not configured for standalone H5P delivery.
        </p>
      </div>
    );
  }

  const checkpointStatus: Status =
    status === "error" ? "error" : complete || status === "verified" ? "verified" : status;
  const showVerified = complete || status === "verified";

  return (
    <div className="h5p-standalone-wrapper">
      <div
        className="h5p-frame h5p-standalone-frame"
        ref={containerRef}
        aria-label={activity.iframeTitle}
      />
      <section className="automatic-checkpoint" data-status={checkpointStatus}>
        <h2 className="automatic-checkpoint-heading">Completion is checked automatically</h2>
        {status === "loading" && (
          <p className="automatic-checkpoint-text">
            Loading the activity player&hellip;
          </p>
        )}
        {status === "ready" && !complete && (
          <p className="automatic-checkpoint-text">
            Complete the activity and select Submit Answers on the final screen. This page will
            update when H5P confirms completion.
          </p>
        )}
        {showVerified && (
          <>
            <h3 className="automatic-checkpoint-verified-heading">Completion verified</h3>
            <p className="automatic-checkpoint-verified-text">
              This activity has confirmed your completed attempt on this device.
            </p>
          </>
        )}
        {status === "error" && (
          <p className="automatic-checkpoint-error-text">
            {errorMsg || "The activity player could not be initialised."}
          </p>
        )}
      </section>
    </div>
  );
}
