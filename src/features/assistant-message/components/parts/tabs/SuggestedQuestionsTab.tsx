"use client";

interface Props {
  questions: string[];
  /** Omitted, the questions render disabled (read-only thread, no sending). */
  onSelect?: (question: string) => void;
}

export function SuggestedQuestionsTab({ questions, onSelect }: Props) {
  if (questions.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      {questions.map((q) => (
        <button
          key={q}
          type="button"
          disabled={!onSelect}
          onClick={() => onSelect?.(q)}
          className="border-border bg-muted/30 hover:bg-muted disabled:hover:bg-muted/30 rounded-md border px-3 py-1.5 text-start text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {q}
        </button>
      ))}
    </div>
  );
}
