import { useEffect, useMemo, useRef, useState } from "react";
import { activities, type Activity, type ActivityId } from "./data/activities";
import {
  loadProgress,
  saveProgress,
  completeActivity,
  emptyProgress,
  type Progress,
  type CompletionMethod,
  type CompletionScore,
} from "./lib/progress";
import { downloadCertificate } from "./lib/certificate";
import StandaloneH5P from "./components/StandaloneH5P";
import logo from "./assets/bpp-logo.svg";
import logoReversed from "./assets/bpp-logo-reversed.svg";

type View = { name: "dashboard" } | { name: "activity"; id: ActivityId } | { name: "certificate" };

const isComplete = (progress: Progress, id: ActivityId): boolean =>
  Boolean(progress.completed[id]);

const completedCount = (progress: Progress): number =>
  activities.reduce((n, a) => n + (isComplete(progress, a.id) ? 1 : 0), 0);

const ACCENT_VAR: Record<Activity["accent"], string> = {
  red: "var(--red)",
  cobalt: "var(--cobalt)",
};

export default function App() {
  const [progress, setProgress] = useState<Progress>(() => emptyProgress());
  const [view, setView] = useState<View>({ name: "dashboard" });
  const [statusMessage, setStatusMessage] = useState<string>("");

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const persist = (next: Progress) => {
    setProgress(next);
    saveProgress(next);
  };

  const allComplete = completedCount(progress) === activities.length;

  const goDashboard = () => setView({ name: "dashboard" });

  const handleComplete = (
    id: ActivityId,
    method: CompletionMethod,
    at: string,
    score?: CompletionScore,
    returnToDashboard = true,
  ) => {
    persist(completeActivity(progress, id, method, at, score));
    const shortTitle = activities.find((a) => a.id === id)!.shortTitle;
    setStatusMessage(`${shortTitle} completion recorded.`);
    if (returnToDashboard) goDashboard();
  };

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <Header onHome={goDashboard} />
      <main id="main" className="main">
        <div className="aria-live" role="status" aria-live="polite">
          {statusMessage}
        </div>
        {view.name === "dashboard" && (
          <Dashboard
            progress={progress}
            allComplete={allComplete}
            onOpenActivity={(id) => setView({ name: "activity", id })}
            onOpenCertificate={() => setView({ name: "certificate" })}
            onReset={() => {
              persist(emptyProgress());
              setStatusMessage("Progress reset.");
            }}
          />
        )}
        {view.name === "activity" && (
          <ActivityDetail
            activity={activities.find((a) => a.id === view.id)!}
            progress={progress}
            onBack={goDashboard}
            onComplete={handleComplete}
          />
        )}
        {view.name === "certificate" && allComplete && (
          <CertificateScreen onBack={goDashboard} onStatus={setStatusMessage} />
        )}
        {view.name === "certificate" && !allComplete && (
          <Dashboard
            progress={progress}
            allComplete={allComplete}
            onOpenActivity={(id) => setView({ name: "activity", id })}
            onOpenCertificate={() => setView({ name: "certificate" })}
            onReset={() => {
              persist(emptyProgress());
              setStatusMessage("Progress reset.");
            }}
          />
        )}
      </main>
      <footer className="site-footer">
        <span>BPP Induction</span>
      </footer>
    </div>
  );
}

function Header({ onHome }: { onHome: () => void }) {
  return (
    <header className="site-header">
      <button className="site-header-home" onClick={onHome} aria-label="BPP induction home">
        <img src={logo} alt="BPP" className="site-header-logo" />
      </button>
      <span className="site-header-tag">Induction essentials</span>
    </header>
  );
}

function Dashboard({
  progress,
  allComplete,
  onOpenActivity,
  onOpenCertificate,
  onReset,
}: {
  progress: Progress;
  allComplete: boolean;
  onOpenActivity: (id: ActivityId) => void;
  onOpenCertificate: () => void;
  onReset: () => void;
}) {
  const [confirmingReset, setConfirmingReset] = useState(false);
  const done = completedCount(progress);
  return (
    <div className="dashboard">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-slash" aria-hidden="true" />
        <div className="hero-dots" aria-hidden="true" />
        <div className="hero-content">
          <img src={logoReversed} alt="BPP" className="hero-logo" />
          <p className="eyebrow">BPP INDUCTION</p>
          <h1 id="hero-title" className="hero-title">
            Values in action.
          </h1>
          <p className="hero-body">
            Two focused activities to help you understand the principles that guide our community and
            the responsibilities we share.
          </p>
        </div>
      </section>

      <section className="section" aria-labelledby="induction-heading">
        <div className="section-head">
          <h2 id="induction-heading" className="section-title">
            Your induction
          </h2>
          <ProgressBlock done={done} total={activities.length} />
        </div>
        <ul className="activity-grid">
          {activities.map((a) => (
            <ActivityCard
              key={a.id}
              activity={a}
              complete={isComplete(progress, a.id)}
              onOpen={() => onOpenActivity(a.id)}
            />
          ))}
        </ul>
      </section>

      <section className="section" aria-labelledby="certificate-heading">
        <h2 id="certificate-heading" className="section-title">
          Certificate
        </h2>
        <div className={`certificate-card ${allComplete ? "is-ready" : "is-locked"}`}>
          <div className="certificate-card-body">
            {allComplete ? (
              <>
                <h3 className="certificate-card-title">Your certificate is ready</h3>
                <p className="certificate-card-text">
                  Both activities are complete. Add your name and download your certificate.
                </p>
                <button className="btn btn-primary" onClick={onOpenCertificate}>
                  Create certificate
                </button>
              </>
            ) : (
              <>
                <h3 className="certificate-card-title">Certificate locked</h3>
                <p className="certificate-card-text">
                  Complete both activities to unlock your certificate.
                </p>
                <button className="btn btn-primary" disabled>
                  Create certificate
                </button>
              </>
            )}
          </div>
          <div className="certificate-card-mark" aria-hidden="true" />
        </div>
      </section>

      <section className="section reset-section" aria-labelledby="reset-heading">
        <h2 id="reset-heading" className="section-title">
          Reset progress
        </h2>
        {confirmingReset ? (
          <div className="reset-panel">
            <p>Reset clears your saved progress and cannot be undone.</p>
            <div className="reset-panel-actions">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  onReset();
                  setConfirmingReset(false);
                }}
              >
                Yes, reset progress
              </button>
              <button className="btn btn-secondary" onClick={() => setConfirmingReset(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button className="btn btn-ghost" onClick={() => setConfirmingReset(true)}>
            Reset progress
          </button>
        )}
      </section>
    </div>
  );
}

function ProgressBlock({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="progress-block">
      <span className="progress-label">
        {done} of {total} complete
      </span>
      <div
        className="progress-bar"
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="Induction progress"
      >
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ActivityCard({
  activity,
  complete,
  onOpen,
}: {
  activity: Activity;
  complete: boolean;
  onOpen: () => void;
}) {
  const accent = ACCENT_VAR[activity.accent];
  return (
    <li className="activity-card" style={{ ["--accent" as string]: accent }}>
      <div className="activity-card-top">
        <span className="activity-card-number">{activity.number}</span>
        <span className={`activity-card-status ${complete ? "is-done" : ""}`}>
          {complete ? "Complete" : "Self-paced"}
        </span>
        <span className="activity-card-arch" aria-hidden="true" />
      </div>
      <div className="activity-card-rule" aria-hidden="true" />
      <h3 className="activity-card-title">{activity.title}</h3>
      <p className="activity-card-desc">{activity.description}</p>
      <div className="activity-card-foot">
        <span className="activity-card-meta">Self-paced</span>
        <button
          className={`btn ${complete ? "btn-secondary" : "btn-primary"}`}
          onClick={onOpen}
          aria-label={`${complete ? "Review" : "Start"} ${activity.title}`}
        >
          {complete ? "Review activity" : "Start activity"}
        </button>
      </div>
    </li>
  );
}

function ActivityDetail({
  activity,
  progress,
  onBack,
  onComplete,
}: {
  activity: Activity;
  progress: Progress;
  onBack: () => void;
  onComplete: (
    id: ActivityId,
    method: CompletionMethod,
    at: string,
    score?: CompletionScore,
    returnToDashboard?: boolean,
  ) => void;
}) {
  const already = isComplete(progress, activity.id);
  const [checked, setChecked] = useState(false);
  const accent = ACCENT_VAR[activity.accent];

  return (
    <div className="activity-detail" style={{ ["--accent" as string]: accent }}>
      <button className="btn btn-ghost back-btn" onClick={onBack}>
        Back to activities
      </button>
      <div className="activity-detail-head">
        <div className="activity-detail-meta">
          <span className="activity-detail-number">{activity.number}</span>
          <span className={`activity-detail-status ${already ? "is-done" : ""}`}>
            {already ? "Complete" : "In progress"}
          </span>
        </div>
        <h1 className="activity-detail-title">{activity.title}</h1>
        <p className="activity-detail-desc">{activity.description}</p>
      </div>

      {activity.delivery.type === "standalone" ? (
        <StandaloneH5P
          activity={activity}
          complete={already}
          onVerified={(at, score) =>
            onComplete(activity.id, "h5p-xapi", at, score, false)
          }
        />
      ) : (
        <>
          <div className="h5p-frame h5p-external-frame">
            <iframe
              src={activity.delivery.embedUrl}
              title={activity.iframeTitle}
              width="1088"
              height="637"
              frameBorder="0"
              allowFullScreen
              allow="autoplay *; geolocation *; microphone *; camera *; midi *; encrypted-media *"
            />
          </div>

          <section className="checkpoint" aria-labelledby="checkpoint-heading">
            <h2 id="checkpoint-heading" className="checkpoint-heading">
              Confirm your completion
            </h2>
            <p className="checkpoint-support">
              This site cannot automatically inspect your activity results. Please confirm below once you
              have completed the activity above.
            </p>
            <label className="checkpoint-pledge">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
              />
              <span>{activity.pledge}</span>
            </label>
            <div className="checkpoint-actions">
              {already ? (
                <button
                  className="btn btn-primary"
                  disabled={!checked}
                  onClick={() =>
                    onComplete(
                      activity.id,
                      "learner-declaration",
                      new Date().toISOString(),
                      undefined,
                      true,
                    )
                  }
                >
                  Update confirmation
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  disabled={!checked}
                  onClick={() =>
                    onComplete(
                      activity.id,
                      "learner-declaration",
                      new Date().toISOString(),
                      undefined,
                      true,
                    )
                  }
                >
                  Mark as complete
                </button>
              )}
              {already && !checked && (
                <span className="checkpoint-already">Already marked complete.</span>
              )}
            </div>
          </section>
        </>
      )}

      {activity.delivery.type === "standalone" && already && (
        <button className="btn btn-ghost back-btn standalone-back-btn" onClick={onBack}>
          Back to activities
        </button>
      )}
    </div>
  );
}

function CertificateScreen({
  onBack,
  onStatus,
}: {
  onBack: () => void;
  onStatus: (msg: string) => void;
}) {
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const certRef = useRef<HTMLDivElement>(null);

  const trimmed = name.trim();
  const nameValid = trimmed.length >= 2 && trimmed.length <= 80;
  const showError = touched && !nameValid;

  const completedDate = useMemo(() => {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
  }, []);

  const handleDownload = async () => {
    if (!nameValid || !certRef.current || preparing) return;
    setPreparing(true);
    setError(null);
    try {
      await downloadCertificate(certRef.current, trimmed);
      onStatus("Certificate downloaded.");
    } catch (e) {
      setError("Sorry, the certificate could not be generated. Please try again.");
      onStatus("Certificate generation failed.");
    } finally {
      setPreparing(false);
    }
  };

  return (
    <div className="certificate-screen">
      <button className="btn btn-ghost back-btn" onClick={onBack}>
        Back to activities
      </button>
      <div className="certificate-form">
        <h1 className="section-title">Your certificate</h1>
        <p className="certificate-form-text">
          Enter your name as you would like it to appear on your certificate.
        </p>
        <label className="field">
          <span className="field-label">Learner name</span>
          <input
            type="text"
            className={`field-input ${showError ? "is-invalid" : ""}`}
            value={name}
            maxLength={80}
            placeholder="Your full name"
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched(true)}
            aria-invalid={showError}
            aria-describedby={showError ? "name-error" : undefined}
          />
          {showError && (
            <span id="name-error" className="field-error">
              {trimmed.length === 0
                ? "Please enter your name."
                : "Name must be between 2 and 80 characters."}
            </span>
          )}
        </label>
        <div className="certificate-form-actions">
          <button
            className="btn btn-primary"
            onClick={handleDownload}
            disabled={!nameValid || preparing}
          >
            {preparing ? "Preparing PDF\u2026" : "Download PDF"}
          </button>
          <button className="btn btn-secondary" onClick={onBack}>
            Back to activities
          </button>
        </div>
        {error && <p className="certificate-error">{error}</p>}
      </div>

      <div className="certificate-preview-wrap">
        <div className="certificate-preview" ref={certRef}>
          <div className="cert-dots" aria-hidden="true" />
          <div className="cert-arch cert-arch-cobalt" aria-hidden="true" />
          <div className="cert-arch cert-arch-red" aria-hidden="true" />
          <div className="cert-inner">
            <img src={logo} alt="BPP" className="cert-logo" />
            <p className="cert-eyebrow">CERTIFICATE OF COMPLETION</p>
            <p className="cert-this">This certifies that</p>
            <p className="cert-name">{trimmed || "Your name"}</p>
            <p className="cert-line">has completed the BPP induction activities</p>
            <p className="cert-activities">British Values & Prevent Duty</p>
            <p className="cert-date">Completed on {completedDate}</p>
            <p className="cert-footer">British Values confirmed by H5P &middot; Prevent Duty confirmed by the learner</p>
          </div>
        </div>
      </div>
    </div>
  );
}
