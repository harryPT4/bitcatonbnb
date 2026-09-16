"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <main className="system-page">
      <p className="eyebrow">Something went sideways</p>
      <h1>The cat knocked this page over.</h1>
      <p>Please try again. No wallet or transaction action was performed.</p>
      <button className="btn-primary" type="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
