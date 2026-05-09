"use client";

import { useTranslations } from "next-intl";
import { Fragment, useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { useIsMobile } from "../../utils";
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

type BreadcrumbProps = { items: BreadcrumbItemData[] };

const ITEMS_TO_DISPLAY = 4;

function BreadcrumbDesktop({
  items,
  generateUrl,
  t,
}: {
  items: BreadcrumbItemData[];
  generateUrl: ReturnType<typeof usePageUrlGenerator>;
  t: ReturnType<typeof useTranslations>;
}) {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <UIBreadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <Link href={generateUrl({ page: `/` })}>{t(`common.home`)}</Link>
        </BreadcrumbItem>
        {items.length > 0 && <BreadcrumbSeparator />}

        {items.length > ITEMS_TO_DISPLAY ? (
          <>
            <BreadcrumbItem>
              {items[0].href ? <Link href={items[0].href}>{items[0].name}</Link> : <>{items[0].name}</>}
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
                      <Link href={item.href ? item.href : "#"}>{item.name}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            {items.slice(-ITEMS_TO_DISPLAY + 2).map((item, index) => (
              <Fragment key={index}>
                <BreadcrumbItem>
                  {item.href ? <Link href={item.href}>{item.name}</Link> : <>{item.name}</>}
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
                  {item.href ? <Link href={item.href}>{item.name}</Link> : <>{item.name}</>}
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
  t,
}: {
  items: BreadcrumbItemData[];
  generateUrl: ReturnType<typeof usePageUrlGenerator>;
  t: ReturnType<typeof useTranslations>;
}) {
  const [open, setOpen] = useState<boolean>(false);

  const lastItem = items[items.length - 1];
  const allItems = [{ name: t(`common.home`), href: generateUrl({ page: `/` }) }, ...items];

  if (!lastItem && items.length === 0) {
    return (
      <UIBreadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link href={generateUrl({ page: `/` })}>{t(`common.home`)}</Link>
          </BreadcrumbItem>
        </BreadcrumbList>
      </UIBreadcrumb>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className="text-foreground text-xs/relaxed font-normal hover:bg-accent flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors outline-none">
        {lastItem?.name}
        <ChevronDownIcon className="text-muted-foreground size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {allItems.map((item, index) => (
          <DropdownMenuItem key={index}>
            {item.href ? <Link href={item.href}>{item.name}</Link> : <>{item.name}</>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function BreadcrumbNavigation({ items }: BreadcrumbProps) {
  const generateUrl = usePageUrlGenerator();
  const t = useTranslations();
  const isMobile = useIsMobile();

  if (isMobile) {
    return <BreadcrumbMobile items={items} generateUrl={generateUrl} t={t} />;
  }

  return <BreadcrumbDesktop items={items} generateUrl={generateUrl} t={t} />;
}
