"use client";

import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { v4 } from "uuid";

type PageSectionProps = {
  children: ReactNode;
  title?: string;
  options?: ReactNode[];
  open?: boolean;
  small?: boolean;
  onToggle?: (isOpen: boolean) => void;
};

export function PageSection({ children, title, options, open, small, onToggle }: PageSectionProps) {
  const [isOpen, setIsOpen] = useState<boolean>(open ?? true);
  const [shouldRender, setShouldRender] = useState<boolean>(open ?? true);

  useEffect(() => {
    if (onToggle) {
      onToggle(isOpen);
    }
  }, [isOpen]);

  const toggleOpen = () => setIsOpen(!isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <section
      id={title ? title.toLowerCase().replaceAll(" ", "") : v4()}
      className={`${isOpen ? "mb-4" : "my-0"} flex w-full scroll-mt-40 flex-col`}
    >
      {title && (
        <div
          className={`${isOpen ? "mb-4" : "mb-0"} flex w-full justify-between border-b ${small ? `border-muted` : `border-primary`} pb-1`}
        >
          <div className="flex w-full cursor-pointer items-center justify-start gap-x-2" onClick={toggleOpen}>
            {isOpen ? (
              <ChevronDownIcon className={`text-primary h-4 w-4`} />
            ) : (
              <ChevronRightIcon className="text-primary h-4 w-4" />
            )}
            <h2 className={`flex w-full ${small === true ? `text-sm` : `text-lg`} text-primary font-semibold`}>
              {title}
            </h2>
          </div>
          {options && <div className="flex gap-2">{options}</div>}
        </div>
      )}
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "" : "max-h-0"}`}>
        {shouldRender && children}
      </div>
    </section>
  );
}
