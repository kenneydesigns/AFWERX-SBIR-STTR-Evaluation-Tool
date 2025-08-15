import './globals.css';
import React from 'react';

export const metadata = {
  title: 'SBIR Readiness',
  description: 'AI-guided SBIR proposal prep',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-[#1f2430]">
          <div className="container flex justify-between items-center py-4">
            <h1 className="text-xl font-semibold">SBIR Readiness</h1>
            <nav className="flex gap-4 text-sm">
              <a href="/dashboard">Dashboard</a>
              <a href="/intake">New Project</a>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
