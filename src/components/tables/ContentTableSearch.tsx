"use client";

import { RefreshCw, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { DataListRetriever, useDebounce } from "../../hooks";
import { Input } from "../../shadcnui";

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
      <Search
        className={`absolute top-1 left-1 h-4 w-4 transition-colors ${
          isExpanded ? "text-muted-foreground" : "text-muted-foreground hover:text-foreground cursor-pointer"
        }`}
        onClick={handleSearchIconClick}
      />
      {isExpanded && (
        <Input
          ref={inputRef}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              handleClear();
            }
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          placeholder={t(`generic.search.placeholder_global`)}
          type="text"
          className="border-border/50 focus-visible:border-border h-10 w-full pr-8 pl-8 text-xs shadow-none focus-visible:ring-0"
          onChange={(e) => setSearchTerm(e.target.value)}
          value={searchTerm}
        />
      )}
      {isExpanded && isSearching && (
        <RefreshCw className="text-muted-foreground absolute top-1 right-1 h-4 w-4 animate-spin" />
      )}
      {isExpanded && !isSearching && searchTermRef.current && (
        <X
          className="text-muted-foreground hover:text-foreground absolute top-1 right-1 h-4 w-4 cursor-pointer"
          onClick={handleClear}
        />
      )}
    </div>
  );
}
