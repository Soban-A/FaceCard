import type { Source } from "~/server/lib/types";

interface Props {
  source: Source;
  index: number;
}

export function SourceCard({ source, index }: Props) {
  return (
    <a
      id={`source-${index}`}
      href={source.url}
      target="_blank"
      rel="noreferrer"
      className="group flex scroll-mt-24 flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-teal-300/40 hover:bg-zinc-900"
    >
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={source.faviconUrl}
          alt=""
          className="h-4 w-4 rounded-sm"
          loading="lazy"
        />
        <span className="truncate text-xs text-zinc-400">{source.domain}</span>
        <span className="ml-auto rounded bg-zinc-800 px-1.5 text-[10px] font-medium text-zinc-400">
          {index}
        </span>
      </div>
      <h3 className="line-clamp-2 text-sm font-medium text-zinc-100 group-hover:text-teal-200">
        {source.title}
      </h3>
      <p className="line-clamp-3 text-xs leading-relaxed text-zinc-400">
        {source.snippet}
      </p>
    </a>
  );
}
