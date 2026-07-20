"use client";

import { usePathname } from "next/navigation";
import { useMobileNavigationItems, type MobileNavigationItem } from "../../contexts/MobileNavigationContext";
import { Link } from "../../shadcnui";
import { cn } from "../../utils/cn";
import { useIsMobile } from "../../utils/use-mobile";

/**
 * Active only for navigational slots.
 *
 * Exact-or-prefix, NOT a bare `startsWith`: the prefix arm keeps a detail route
 * (/accounts/123) highlighting its section (/accounts).
 *
 * "/" is special-cased to EXACT match. Without that, its prefix arm degenerates
 * to `pathname.startsWith("/")`, which is true for every route, and the Home
 * slot highlights everywhere. This is pinned by a unit test in Task C.
 */
function isActiveHref(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const slotClass = cn(
  // min-h-12/min-w-12 = 48px touch target (Material/HIG guidance).
  "relative flex min-h-12 min-w-12 flex-1 items-center justify-center",
  "transition-colors",
);

function SlotContent({ item }: { item: MobileNavigationItem }) {
  if (item.render) return <>{item.render}</>;
  const Icon = item.icon;
  return Icon ? <Icon className="size-6" /> : null;
}

/**
 * The mobile bottom navigation bar.
 *
 * Renders nothing on desktop, and nothing when the application supplied no
 * items — so page containers can render it unconditionally.
 *
 * Rendered as an in-flow flex sibling of the page content (NOT position:fixed),
 * so the content column shrinks to fit and can never be hidden behind the bar.
 */
export function MobileNavigationBar() {
  const items = useMobileNavigationItems();
  const isMobile = useIsMobile();
  const pathname = usePathname();

  if (!isMobile || items.length === 0) return null;

  // A detached surface sitting BELOW the page card with a gap, so it carries a
  // rounded border rather than a `border-t`, which would read as if the bar were
  // welded to the card's bottom edge. `bg-sidebar` deliberately matches the
  // Header's own background so the two chrome edges of the viewport agree.
  //
  // Deliberately NO bottom safe-area padding here. The inset is reserved by the
  // page shell's bottom padding (RoundPageContainer) so this card keeps its
  // natural height and floats above the home indicator, rather than growing to
  // enclose 34px of dead space with the icons pinned to its top edge.
  return (
    <nav
      aria-label="Primary"
      data-testid="mobile-navigation-bar"
      className="bg-sidebar flex w-full shrink-0 flex-row items-stretch rounded-lg border"
    >
      {items.map((item) => {
        const active = item.href ? isActiveHref(pathname, item.href) : false;
        const tone = active ? "text-primary" : "text-muted-foreground";

        const body = (
          <>
            {active && <span aria-hidden className="bg-primary absolute inset-x-0 top-0 h-0.5" />}
            <SlotContent item={item} />
          </>
        );

        return item.href ? (
          <Link
            key={item.key}
            href={item.href}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            data-testid={`mobile-nav-${item.key}`}
            className={cn(slotClass, tone)}
          >
            {body}
          </Link>
        ) : (
          <button
            key={item.key}
            type="button"
            onClick={item.onClick}
            aria-label={item.label}
            data-testid={`mobile-nav-${item.key}`}
            className={cn(slotClass, tone)}
          >
            {body}
          </button>
        );
      })}
    </nav>
  );
}
