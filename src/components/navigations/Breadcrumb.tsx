"use client";

import { useTranslations } from "next-intl";
import { Fragment, useState, type MouseEvent } from "react";
import { ChevronDownIcon } from "lucide-react";
import { cn, useIsMobile } from "../../utils";
import { usePageUrlGenerator } from "../../hooks";
import { BreadcrumbItemData } from "../../interfaces";
import {
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Link,
  Breadcrumb as UIBreadcrumb,
} from "../../shadcnui";

type BreadcrumbProps = { items: BreadcrumbItemData[]; rootLabel?: string; showRoot?: boolean };

const ITEMS_TO_DISPLAY = 4;

function BreadcrumbDesktop({
  items,
  generateUrl,
  rootLabel,
  showRoot,
}: {
  items: BreadcrumbItemData[];
  generateUrl: ReturnType<typeof usePageUrlGenerator>;
  rootLabel: string;
  showRoot: boolean;
}) {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <UIBreadcrumb>
      <BreadcrumbList>
        {showRoot && (
          <>
            <BreadcrumbItem>
              <Link href={generateUrl({ page: `/` })}>{rootLabel}</Link>
            </BreadcrumbItem>
            {items.length > 0 && <BreadcrumbSeparator />}
          </>
        )}

        {items.length > ITEMS_TO_DISPLAY ? (
          <>
            <BreadcrumbItem>
              {items[0].href ? (
                <Link href={items[0].href} onClick={items[0].onClick}>
                  {items[0].name}
                </Link>
              ) : (
                <>{items[0].name}</>
              )}
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <DropdownMenu open={open} onOpenChange={setOpen}>
                <DropdownMenuTrigger className="flex items-center gap-1" aria-label="Toggle menu">
                  <BreadcrumbEllipsis className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {items.slice(1, -ITEMS_TO_DISPLAY + 2).map((item, index) => (
                    <DropdownMenuItem key={index}>
                      <Link href={item.href ? item.href : "#"} onClick={item.onClick}>
                        {item.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            {items.slice(-ITEMS_TO_DISPLAY + 2).map((item, index) => (
              <Fragment key={index}>
                <BreadcrumbItem>
                  {item.href ? (
                    <Link href={item.href} onClick={item.onClick}>
                      {item.name}
                    </Link>
                  ) : (
                    <>{item.name}</>
                  )}
                </BreadcrumbItem>
                {index < items.slice(-ITEMS_TO_DISPLAY + 2).length - 1 && <BreadcrumbSeparator />}
              </Fragment>
            ))}
          </>
        ) : (
          <>
            {items.map((item, index) => (
              <Fragment key={index}>
                <BreadcrumbItem>
                  {item.href ? (
                    <Link href={item.href} onClick={item.onClick}>
                      {item.name}
                    </Link>
                  ) : (
                    <>{item.name}</>
                  )}
                </BreadcrumbItem>
                {index < items.length - 1 && <BreadcrumbSeparator />}
              </Fragment>
            ))}
          </>
        )}
      </BreadcrumbList>
    </UIBreadcrumb>
  );
}

function BreadcrumbMobile({
  items,
  generateUrl,
  rootLabel,
  showRoot,
}: {
  items: BreadcrumbItemData[];
  generateUrl: ReturnType<typeof usePageUrlGenerator>;
  rootLabel: string;
  showRoot: boolean;
}) {
  const [open, setOpen] = useState<boolean>(false);

  const lastItem = items[items.length - 1];
  const allItems: BreadcrumbItemData[] = showRoot
    ? [{ name: rootLabel, href: generateUrl({ page: `/` }) }, ...items]
    : items;

  if (!lastItem && items.length === 0) {
    // Nothing to show at all once the root entry is suppressed.
    if (!showRoot) return null;
    return (
      <UIBreadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link href={generateUrl({ page: `/` })}>{rootLabel}</Link>
          </BreadcrumbItem>
        </BreadcrumbList>
      </UIBreadcrumb>
    );
  }

  // One entry means the menu could only offer the page already on screen, so
  // the chevron promised a choice that does not exist: show plain text.
  if (allItems.length <= 1) {
    return (
      <span className="text-foreground block min-w-0 truncate px-1.5 text-xs/relaxed font-normal">
        {lastItem?.name}
      </span>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      {/* min-h-9: a 36px tap target, where the bare text row was ~20px. */}
      <DropdownMenuTrigger className="text-foreground text-xs/relaxed font-normal hover:bg-accent flex min-h-9 min-w-0 items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors outline-none">
        <span className="truncate">{lastItem?.name}</span>
        <ChevronDownIcon className="text-muted-foreground size-3.5 shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {allItems.map((item, index) =>
          item.href ? (
            // The item renders AS the link, so the whole row navigates — a Link
            // nested inside the row only answered taps on its own text.
            <DropdownMenuItem
              key={index}
              className="min-h-10"
              render={(props) => (
                <Link
                  {...props}
                  href={item.href!}
                  className={cn(props.className, "text-foreground font-normal")}
                  onClick={(event: MouseEvent<HTMLAnchorElement>) => {
                    props.onClick?.(event);
                    item.onClick?.();
                  }}
                >
                  {props.children}
                </Link>
              )}
            >
              {item.name}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem key={index} className="min-h-10">
              {item.name}
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function BreadcrumbNavigation({ items, rootLabel, showRoot = true }: BreadcrumbProps) {
  const generateUrl = usePageUrlGenerator();
  const t = useTranslations();
  const isMobile = useIsMobile();

  const root = rootLabel?.trim() ? rootLabel : t(`common.home`);

  if (isMobile) {
    return <BreadcrumbMobile items={items} generateUrl={generateUrl} rootLabel={root} showRoot={showRoot} />;
  }

  return <BreadcrumbDesktop items={items} generateUrl={generateUrl} rootLabel={root} showRoot={showRoot} />;
}
