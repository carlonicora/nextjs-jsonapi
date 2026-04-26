"use client";

interface Props {
  questions: string[];
  onSelect: (question: string) => void;
}

export function SuggestedQuestionsTab({ questions, onSelect }: Props) {
  if (questions.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      {questions.map((q) => (
        <button
          key={q}
          type="button"
          onClick={() => onSelect(q)}
          className="border-border bg-muted/30 hover:bg-muted rounded-md border px-3 py-1.5 text-left text-sm"
        >
          {q}
        </button>
      ))}
    </div>
  );
}
