'use client';

type Intake = {
  title: string;
  agency: string;
  problem: string;
  solution: string;
  team: string;
  commercialization: string;
};

export default function DashboardPage() {
  const intake: Intake | null = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('lastIntake') || "null")
    : null;

  return (
    <div className="mt-8 grid gap-4">
      <div className="card">
        <h2 className="text-xl font-semibold">Projects</h2>
        {!intake && <p className="opacity-80 mt-2">No projects yet. <a className="underline" href="/intake">Create one</a>.</p>}
        {intake && (
          <div className="mt-3">
            <div className="flex justify-between">
              <div>
                <div className="font-medium">{intake.title}</div>
                <div className="text-sm opacity-80">{intake.agency}</div>
              </div>
              <a className="btn" href={`/projects/demo`}>Open</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
