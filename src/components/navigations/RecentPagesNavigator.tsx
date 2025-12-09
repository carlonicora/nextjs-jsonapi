"use client";

import { useAtomValue } from "jotai";
import { HistoryIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { recentPagesAtom } from "../../atoms";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Link,
  useSidebar,
} from "../../shadcnui";

export function RecentPagesNavigator() {
  const recentPages = useAtomValue(recentPagesAtom);
  const t = useTranslations();
  const { state } = useSidebar();

  if (recentPages.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex w-full cursor-pointer items-center gap-2">
          {state === "collapsed" ? <HistoryIcon className="h-4 w-4" /> : <span>{t(`generic.recent_pages`)}</span>}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-96">
        <DropdownMenuLabel>{t(`generic.recent_pages`)}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {recentPages.map((page, index) => (
          <DropdownMenuItem key={`${page.url}-${index}`} asChild>
            <Link href={page.url} className="flex items-center gap-2">
              <div className="flex flex-col">
                <div className="truncate text-sm">{page.title}</div>
                <div className="text-muted-foreground text-xs font-normal">
                  {t(`types.${page.moduleType}`, { count: 1 })}
                </div>
              </div>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
