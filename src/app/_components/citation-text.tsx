import { Children, isValidElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Source } from "~/server/lib/types";

interface Props {
  text: string;
  sources: Source[];
  streaming: boolean;
}

/**
 * Renders the streamed answer as Markdown, with `[N]` tokens inside any text
 * node replaced by citation chips that scroll to the matching source card.
 */
export function CitationText({ text, sources, streaming }: Props) {
  const replace = (children: ReactNode) =>
    replaceCitations(children, sources);

  return (
    <div className="prose-answer text-[15px] leading-relaxed text-zinc-100">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="my-3 first:mt-0 last:mb-0">{replace(children)}</p>
          ),
          ul: ({ children }) => (
            <ul className="my-3 list-disc space-y-1 pl-5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-3 list-decimal space-y-1 pl-5">{children}</ol>
          ),
          li: ({ children }) => <li>{replace(children)}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-zinc-50">
              {replace(children)}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic">{replace(children)}</em>
          ),
          h1: ({ children }) => (
            <h3 className="mt-4 mb-2 text-lg font-semibold">
              {replace(children)}
            </h3>
          ),
          h2: ({ children }) => (
            <h3 className="mt-4 mb-2 text-base font-semibold">
              {replace(children)}
            </h3>
          ),
          h3: ({ children }) => (
            <h4 className="mt-3 mb-2 text-sm font-semibold">
              {replace(children)}
            </h4>
          ),
          code: ({ children }) => (
            <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[13px] text-teal-200">
              {children}
            </code>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-teal-300 underline-offset-2 hover:underline"
            >
              {children}
            </a>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
      {streaming && (
        <span
          aria-hidden
          className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-pulse bg-teal-300"
        />
      )}
    </div>
  );
}

function CitationChip({ index, source }: { index: number; source: Source }) {
  return (
    <a
      href={`#source-${index}`}
      title={source.title}
      onClick={(e) => {
        e.preventDefault();
        document.getElementById(`source-${index}`)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }}
      className="mx-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded bg-zinc-800 px-1 align-text-top text-[11px] font-medium text-teal-300 no-underline transition hover:bg-teal-300 hover:text-zinc-950"
    >
      {index}
    </a>
  );
}

/**
 * Walk the children of a Markdown-rendered element and replace any `[N]` tokens
 * inside string children with citation chips. Recurses into React elements so
 * citations work inside <strong>, <em>, list items, etc.
 */
function replaceCitations(children: ReactNode, sources: Source[]): ReactNode {
  return Children.map(children, (child, idx) => {
    if (typeof child === "string") {
      return splitOnCitations(child, sources, `s-${idx}`);
    }
    if (isValidElement<{ children?: ReactNode }>(child)) {
      const inner = child.props.children;
      if (inner == null) return child;
      return {
        ...child,
        props: { ...child.props, children: replaceCitations(inner, sources) },
      };
    }
    return child;
  });
}

function splitOnCitations(
  text: string,
  sources: Source[],
  keyPrefix: string,
): ReactNode[] {
  const parts = text.split(/(\[\d+\])/g);
  return parts.map((part, i) => {
    const m = /^\[(\d+)\]$/.exec(part);
    if (m) {
      const n = Number(m[1]);
      const source = sources[n - 1];
      if (source) {
        return <CitationChip key={`${keyPrefix}-${i}`} index={n} source={source} />;
      }
    }
    return <span key={`${keyPrefix}-${i}`}>{part}</span>;
  });
}
