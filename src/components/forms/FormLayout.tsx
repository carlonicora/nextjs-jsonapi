import { ReactNode } from "react";
import { cn } from "../../utils";

// FormBody — the rhythm container; replaces an editor's root <div className="flex w-full flex-col">
export function FormBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex w-full flex-col gap-4", className)}>{children}</div>;
}

// FormSection — titled/untitled group; pt-4 (first:pt-0) yields 32px before the header
export function FormSection({
  title,
  children,
  className,
}: {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col gap-4 pt-4 first:pt-0", className)}>
      {title && <h3 className="text-lg font-semibold">{title}</h3>}
      {children}
    </section>
  );
}

// FormRow — responsive column grid, both axes gapped
export function FormRow({
  children,
  columns = 2,
  className,
}: {
  children: ReactNode;
  columns?: 2 | 3;
  className?: string;
}) {
  return (
    <div
      className={cn("grid grid-cols-1 gap-x-4 gap-y-4", columns === 3 ? "md:grid-cols-3" : "md:grid-cols-2", className)}
    >
      {children}
    </div>
  );
}

// FormCol — column span for a child inside FormRow (replaces <div className="md:col-span-2">)
export function FormCol({
  children,
  span = 1,
  className,
}: {
  children: ReactNode;
  span?: 1 | 2 | 3;
  className?: string;
}) {
  const spanClass = span === 3 ? "md:col-span-3" : span === 2 ? "md:col-span-2" : "";
  return <div className={cn(spanClass, className)}>{children}</div>;
}
