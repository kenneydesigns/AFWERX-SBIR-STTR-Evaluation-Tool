export default function HomePage() {
  return (
    <div className="mt-10 grid gap-6">
      <div className="card">
        <h2 className="text-2xl font-semibold mb-2">Turn SBIR chaos into a shippable proposal</h2>
        <p className="opacity-80">
          AI‑guided outlines, evaluator‑style scoring, and red‑team reviews—so you submit with confidence.
        </p>
        <div className="mt-4 flex gap-3">
          <a className="btn" href="/intake">Create a project</a>
          <a className="btn" href="/dashboard">Go to dashboard</a>
        </div>
      </div>
    </div>
  );
}
