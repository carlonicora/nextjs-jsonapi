import { ReactNode, Children } from "react";

export function Steps({ children }: { children: ReactNode }) {
  const items = Children.toArray(children);
  return (
    <ol className="my-4 list-none space-y-3 pl-0">
      {items.map((child, i) => (
        <li key={i} className="flex gap-3">
          <span className="bg-muted text-muted-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs">
            {i + 1}
          </span>
          <div className="flex-1 [&>p:first-child]:mt-0">{child}</div>
        </li>
      ))}
    </ol>
  );
}

export function Step({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
