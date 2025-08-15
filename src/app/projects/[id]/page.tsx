'use client';

import { useState } from 'react';

const defaultSection = `Background: ...\n\nTechnical Approach: ...\n\nCommercialization Plan: ...`;

export default function ProjectPage() {
  const [text, setText] = useState(defaultSection);
  const [scores, setScores] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleScore = async () => {
    setLoading(true);
    setScores(null);
    try {
      const res = await fetch('/api/score-demo', {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setScores(data.items || []);
    } catch (e) {
      alert('Scoring failed. Did you set OPENAI_API_KEY on Vercel?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 grid gap-4">
      <div className="card">
        <h2 className="text-xl font-semibold mb-3">Outline / Draft</h2>
        <textarea className="w-full p-2 rounded bg-[#0c0e14] border border-[#1f2430]" rows={14}
          value={text} onChange={e => setText(e.target.value)} />
        <div className="mt-3 flex gap-2">
          <button className="btn" onClick={handleScore} disabled={loading}>
            {loading ? 'Scoring…' : 'Evaluate against rubric'}
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-2">Scores</h3>
        {!scores && <p className="opacity-80">Run an evaluation to see scores.</p>}
        {scores && (
          <div className="grid gap-2">
            {scores.map((s, i) => (
              <div key={i} className="flex justify-between border border-[#1f2430] p-3 rounded">
                <div>
                  <div className="font-medium">{s.criterion_key}</div>
                  <div className="text-sm opacity-80">{s.rationale}</div>
                </div>
                <div className="text-2xl font-semibold">{s.score.toFixed(1)}/5</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
