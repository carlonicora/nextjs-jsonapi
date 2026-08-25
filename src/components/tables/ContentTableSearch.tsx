"use client";

import { RefreshCw, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { DataListRetriever, useDebounce } from "../../hooks";
import { Button, Input } from "../../shadcnui";

type ContentTableSearchProps = {
  data: DataListRetriever<any>;
};

export function ContentTableSearch({ data }: ContentTableSearchProps) {
  const t = useTranslations();
  const searchTermRef = useRef<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const isExpanded = isFocused || searchTerm.length > 0;

  const search = useCallback(
    async (searchedTerm: string) => {
      try {
        if (searchedTerm === searchTermRef.current) return;
        searchTermRef.current = searchedTerm;

        await data.search(searchedTerm);
      } finally {
        setIsSearching(false);
      }
    },
    [searchTermRef, data],
  );

  const updateSearchTerm = useDebounce(search, 500);

  useEffect(() => {
    setIsSearching(true);
    updateSearchTerm(searchTerm);
  }, [updateSearchTerm, searchTerm]);

  const handleSearchIconClick = () => {
    if (!isExpanded) {
      setIsFocused(true);
      // Small delay to ensure the input is rendered before focusing
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleBlur = () => {
    // Auto-collapse only if search is empty
    if (searchTerm.length === 0) {
      setIsFocused(false);
    }
  };

  const handleClear = () => {
    setSearchTerm("");
    search("");
    setIsFocused(false);
  };

  return (
    <div
      className={`relative flex h-6 items-center text-xs font-normal transition-all duration-300 ease-in-out ${
        isExpanded ? "w-64" : "w-6"
      }`}
    >
      {/* Collapsed, this glyph is the ONLY way to open search — as a bare <svg onClick> it had
          no role, no tab stop and no name, so search was unreachable without a pointer on every
          list in the product. Expanded, it is purely decorative and must NOT be a tab stop.
          Labels reuse keys that exist in every consuming app; a new package-level key would
          throw MISSING_MESSAGE wherever it had not been added. */}
      {isExpanded ? (
        <Search aria-hidden className="text-muted-foreground absolute top-1 start-1 size-4" />
      ) : (
        <Button
          data-testid="content-table-search-trigger"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-foreground absolute top-0 start-0"
          onClick={handleSearchIconClick}
        >
          <Search className="size-4" />
          <span className="sr-only">{t(`ui.search.button`)}</span>
        </Button>
      )}
      {isExpanded && (
        <Input
          data-testid="content-table-search-input"
          ref={inputRef}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              handleClear();
            }
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          placeholder={t(`ui.search.placeholder_global`)}
          type="text"
          className="border-border/50 focus-visible:border-border h-10 w-full pe-8 ps-8 text-xs shadow-none focus-visible:ring-0"
          onChange={(e) => setSearchTerm(e.target.value)}
          value={searchTerm}
        />
      )}
      {isExpanded && isSearching && (
        <RefreshCw className="text-muted-foreground absolute top-1 end-1 h-4 w-4 animate-spin" />
      )}
      {isExpanded && !isSearching && searchTermRef.current && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-foreground absolute top-0 end-0"
          onClick={handleClear}
        >
          <X className="size-4" />
          <span className="sr-only">{t(`ui.buttons.clear`)}</span>
        </Button>
      )}
    </div>
  );
}
