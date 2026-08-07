export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-black">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          PropTune Demo CRM
        </h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          API-first. No UI here yet — see{" "}
          <code className="rounded bg-black/[.06] px-1.5 py-0.5 font-mono text-[0.9em] dark:bg-white/[.08]">
            API.md
          </code>{" "}
          for the full <code className="font-mono">/api/v1</code> reference.
        </p>
      </div>
    </div>
  );
}
