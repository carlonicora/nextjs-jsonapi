"use client";

import { useTheme } from "next-themes";
import { useEffect, useId, useState } from "react";

type MermaidDiagramProps = {
  /** The body of a ```mermaid fence, verbatim. */
  chart: string;
};

/**
 * One Mermaid diagram, rendered in the browser.
 *
 * Four decisions worth keeping:
 *
 * 1. **`mermaid` is imported dynamically, inside the effect.** The library is
 *    roughly half a megabyte gzipped. A static import at module scope would put
 *    it in the bundle of every page that renders any markdown at all; this way
 *    only a page that actually holds a diagram fetches it.
 * 2. **The id comes from `useId`.** Mermaid keys its internal definitions by the
 *    id it is handed, and two diagrams sharing one silently blank the second.
 * 3. **A parse failure falls back to the source.** Mermaid throws on malformed
 *    input and, worse, injects its own error graphic into the document when it
 *    does — `suppressErrorRendering` turns that off, and the caller renders the
 *    fenced block it would have shown anyway. A bad diagram must never cost the
 *    reader the rest of the page.
 * 4. **The theme is read, not assumed.** `resolvedTheme` resolves "system" to a
 *    real value; re-running on a change is what keeps a diagram from staying
 *    black-on-black after the mode flips. Mirrors `TokenUsageTimelineChart`.
 */
export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const reactId = useId();
  const { resolvedTheme } = useTheme();
  const [svg, setSvg] = useState<string | undefined>(undefined);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const draw = async () => {
      try {
        const mermaid = (await import("mermaid")).default;

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          suppressErrorRendering: true,
          theme: resolvedTheme === "dark" ? "dark" : "default",

          // `useMaxWidth: false` on every diagram type this documentation uses.
          //
          // By default Mermaid emits `width="100%"` with a viewBox, so the
          // drawing scales to whatever box it lands in — inside a reading
          // column that shrinks a seven-node graph until its labels are
          // unreadable, and no CSS `max-width` can undo it because the scaling
          // comes from the viewBox, not the width limit. With it off the SVG
          // carries its intrinsic width and the wrapper scrolls to it, the same
          // bargain a wide table makes.
          flowchart: { useMaxWidth: false },
          sequence: { useMaxWidth: false },
          class: { useMaxWidth: false },
          state: { useMaxWidth: false },
          er: { useMaxWidth: false },
          journey: { useMaxWidth: false },
          gantt: { useMaxWidth: false },
          pie: { useMaxWidth: false },
        });

        // Colons and other punctuation React puts in a useId are not legal in
        // the DOM id Mermaid derives from this one.
        const id = `mermaid-${reactId.replace(/[^a-zA-Z0-9-]/g, "")}`;
        const result = await mermaid.render(id, chart);

        if (cancelled) return;
        setSvg(result.svg);
        setFailed(false);
      } catch {
        if (cancelled) return;
        setFailed(true);
        setSvg(undefined);
      }
    };

    void draw();

    return () => {
      cancelled = true;
    };
  }, [chart, reactId, resolvedTheme]);

  // Before the first render resolves, and after a failure, show the source. It
  // is what the page displayed before diagrams were drawn at all, so the reader
  // never ends up with less than they had.
  if (failed || svg === undefined)
    return (
      // rtl-ok: deliberate LTR island (diagram source)
      <pre dir="ltr" className="overflow-x-auto">
        <code dir="ltr">{chart}</code>
      </pre>
    );

  return (
    <div
      // Mermaid emits a complete <svg> document. It is generated from the
      // repository's own documentation, and `securityLevel: "strict"` has
      // already stripped script and foreign content from it.
      // `!max-w-none`, not `max-w-full`. Mermaid writes an inline
      // `max-width` on the SVG, and honouring it inside a reading column
      // squeezes a wide graph until its labels are unreadable — the diagram is
      // technically present and practically useless. An `!important` rule is
      // what beats an inline style, so the graph keeps its natural size and the
      // wrapper scrolls to it, exactly as a wide table does.
      className="my-4 overflow-x-auto [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:!max-w-none"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
