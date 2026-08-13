"use client";

import { useAtomValue } from "jotai";
import { HistoryIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { recentPagesAtom } from "../../atoms";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Link,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../../shadcnui";

/**
 * A complete sidebar row. It renders its own SidebarMenuItem and owns its
 * trigger; consumers drop it into a SidebarMenu and add nothing around it.
 *
 * The trigger IS the SidebarMenuButton. Wrapping this component in a
 * consumer-owned SidebarMenuButton instead — which four apps used to do —
 * leaves the real trigger as an inline element inside a button that
 * `group-data-[collapsible=icon]:size-8! p-2! overflow-hidden` clamps to a
 * 16px content box once the rail collapses. The trigger shrinks to zero width
 * behind the consumer's own icon, and the icon the user clicks belongs to a
 * button with no handler.
 */
export function RecentPagesNavigator() {
  const recentPages = useAtomValue(recentPagesAtom);
  const t = useTranslations();
  const { isMobile } = useSidebar();
  const pathname = usePathname();

  // The page the user is standing on is not somewhere to navigate back to, so
  // it is hidden while they are there. Filtering happens here rather than in
  // usePageTracker so the page stays recorded and reappears at the top the
  // moment they leave. A sub-path counts as being on the entity: the
  // /campaigns/:id entry is hidden while the user is at /campaigns/:id/canvas.
  //
  // usePathname is typed non-nullable but is not trusted to be — usePageTracker
  // guards it the same way. With no path known, hide nothing rather than
  // throwing inside a component that renders on every page.
  const isCurrentPage = (url: string) => !!pathname && (pathname === url || pathname.startsWith(`${url}/`));

  const pages = recentPages.filter((page) => !isCurrentPage(page.url));

  if (pages.length === 0) return null;

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        {/* No collapsed/expanded branch: SidebarMenuButton's own `tooltip` prop
            renders exactly when the rail is collapsed on desktop, and the label
            is clipped by the button's overflow-hidden like every other row. */}
        <DropdownMenuTrigger
          data-testid="sidebar-recent-pages"
          render={
            <SidebarMenuButton
              className="text-muted-foreground hover:bg-muted/50 cursor-pointer"
              tooltip={t(`common.recent_pages`)}
            />
          }
        >
          <HistoryIcon />
          <span>{t(`common.recent_pages`)}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent side={isMobile ? "bottom" : "right"} align="start" className="w-96">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{t(`common.recent_pages`)}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {pages.map((page, index) => (
              <DropdownMenuItem
                key={`${page.url}-${index}`}
                render={<Link href={page.url} className="flex items-center gap-2" />}
              >
                <div className="flex flex-col">
                  <div className="truncate">{page.title}</div>
                  <div className="text-muted-foreground text-xs font-normal">
                    {t(`entities.${page.moduleType}`, { count: 1 })}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
