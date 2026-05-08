import { SearchView } from "~/app/_components/search-view";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-10 sm:py-16">
      <header className="mb-10 sm:mb-14">
        <h1 className="text-3xl font-semibold tracking-tight">
          <span className="text-teal-300">/</span>search
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Ask anything. Answers grounded in live web results, with citations.
        </p>
      </header>
      <SearchView />
    </main>
  );
}
