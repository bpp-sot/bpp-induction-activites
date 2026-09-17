# BPP Induction microsite

Static React/Vite app deployed to GitHub Pages at
`https://bpp-sot.github.io/bpp-induction-activites/` (repo `bpp-sot/bpp-induction-activites`).

## Commands

- `npm test -- --run` — unit tests (Vitest). Expect 15 tests across `src/lib/h5p.test.ts` and `src/lib/progress.test.ts`.
- `npm run build` — type-check (`tsc -b`) then Vite build into `dist/`.
- `npm run dev` — local dev server.

`postinstall`, `predev` and `prebuild` run `scripts/copy-h5p-player.mjs`, which copies
`node_modules/h5p-standalone/dist` into `public/h5p-player/`. That output is generated and git-ignored.

## Architecture

- Both activities are self-hosted H5P Interactive Videos (`public/h5p-content/british-values/`
  and `public/h5p-content/prevent-duty/`), run by `h5p-standalone`. Completion is detected from
  the real xAPI dispatcher via `src/lib/h5p.ts` (`getVerifiedCompletion`), which accepts only a
  top-level `completed` statement with `result.completion === true` and valid score data.
  Child `answered` events also carry `completion: true`, so the top-level check is load-bearing.
- Progress lives in `localStorage` (key `bpp-induction-progress-v2`) and records a per-activity
  completion method and optional score. Both activities expect `h5p-xapi`; a stored
  `learner-declaration` is rejected. Nothing is sent to a server.

## Gotchas

- `.gitignore` must use `/dist/` (root only). A bare `dist/` also ignores the H5P libraries'
  own `dist/` folders, which silently breaks `H5P.InteractiveVideo` on the deployed site while
  local builds still work.
- `public/.nojekyll` disables Jekyll processing on GitHub Pages so player assets are served verbatim.
- The British Values video is ~98 MiB — under GitHub's 100 MiB per-file limit but above its
  recommended 50 MiB, so pushes emit a warning.
- `src/main.tsx` intentionally omits `StrictMode`: double-mounting re-initialises the imperative H5P player.
- Instantiating an H5P standalone player clears `window.H5PStandalone`. `StandaloneH5P.tsx` caches
  the constructor before first use; without that, opening a second activity in the same page session
  fails with "H5P Standalone player failed to load".
- Browser-side completion is not tamper-proof; it verifies the event the browser received, not learner identity.
