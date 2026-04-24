import { cn } from '@/lib/cn';

function App() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className={cn('card max-w-lg w-full text-center space-y-4')}>
        <h1 className="page-title">Inventory · Pump &amp; Fire Fighting</h1>
        <p className="text-sm text-slate-600">
          Project bootstrap complete. Tailwind, aliases, and structure are wired
          up. Build screens under{' '}
          <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">
            src/pages
          </code>
          .
        </p>
        <div className="flex gap-2 justify-center pt-2">
          <span className="inline-flex items-center rounded-full bg-sky-100 text-sky-700 text-xs font-medium px-2.5 py-0.5">
            Step 01 ✓
          </span>
          <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-0.5">
            Step 02 — Design system
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;
