import { BellIcon, ExternalLinkIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { showToast } from "../../../../utils/toast";
import { cn } from "../../../../utils";
import { useSocketContext } from "../../../../contexts";
import { Modules } from "../../../../core";
import { usePageUrlGenerator } from "../../../../hooks";
import {
  Link,
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  ScrollArea,
  SidebarMenuButton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../../../shadcnui";
import { useNotificationContext } from "../../contexts/NotificationContext";
import { NotificationInterface } from "../../data";
import { NotificationErrorBoundary } from "../common";

interface NotificationModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

function NotificationModalContent({ isOpen, setIsOpen }: NotificationModalProps) {
  const _instanceId = useRef(Math.random().toString(36).substr(2, 9));
  const {
    notifications,
    addNotification,
    generateNotification,
    generateToastNotification,
    markNotificationsAsRead,
    isLoading,
    error,
    loadNotifications,
    shouldRefresh,
  } = useNotificationContext();
  const {
    socketNotifications,
    removeSocketNotification: _removeSocketNotification,
    clearSocketNotifications,
  } = useSocketContext();
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();
  const [newNotifications, setNewNotifications] = useState<boolean>(false);
  const preventAutoClose = useRef(false);

  const circuitBreakerRef = useRef({
    count: 0,
    resetTime: 0,
    isOpen: false,
  });

  const checkCircuitBreaker = useCallback(() => {
    const now = Date.now();
    const breaker = circuitBreakerRef.current;

    // Reset counter every 10 seconds
    if (now > breaker.resetTime) {
      breaker.count = 0;
      breaker.resetTime = now + 10000; // 10 seconds
      breaker.isOpen = false;
    }

    // Trip breaker if more than 20 notifications in 10 seconds
    breaker.count++;
    if (breaker.count > 20) {
      breaker.isOpen = true;
      return false;
    }

    return !breaker.isOpen;
  }, []);

  const { unreadCount, unreadIds } = useMemo(() => {
    const unreadNotifications = notifications.filter((notif) => !notif.isRead);
    return {
      unreadCount: unreadNotifications.length,
      unreadIds: unreadNotifications.map((notif) => notif.id),
    };
  }, [notifications]);

  useEffect(() => {
    setNewNotifications(unreadCount > 0);
  }, [unreadCount]);

  // The initial load is owned by NotificationContextProvider's mount effect.
  // The bell still refreshes on open when the cache is stale (see handleOpenChange).

  const processSocketNotifications = useCallback(() => {
    if (socketNotifications.length === 0) {
      return;
    }

    if (!checkCircuitBreaker()) {
      clearSocketNotifications(); // Still clear to prevent memory leaks
      return;
    }

    const currentSocketNotifications = [...socketNotifications];
    clearSocketNotifications();

    // Process notifications in smaller batches to prevent UI freeze
    const batchSize = 3;
    const batches = [];
    for (let i = 0; i < currentSocketNotifications.length; i += batchSize) {
      batches.push(currentSocketNotifications.slice(i, i + batchSize));
    }

    batches.forEach((batch, batchIndex) => {
      setTimeout(() => {
        batch.forEach((notification) => {
          addNotification(notification);
          const toastNotification = generateToastNotification(notification, t, generateUrl);

          showToast(toastNotification.title, {
            description: toastNotification.description,
            action: toastNotification.action,
            // A toast that offers something to press stays until dismissed; a
            // plain notice keeps sonner's default timeout.
            duration: toastNotification.action ? Infinity : undefined,
          });
        });

        // Only set newNotifications on the last batch
        if (batchIndex === batches.length - 1) {
          setNewNotifications(true);
        }
      }, batchIndex * 100); // 100ms delay between batches
    });
  }, [
    socketNotifications,
    clearSocketNotifications,
    addNotification,
    generateToastNotification,
    t,
    generateUrl,
    checkCircuitBreaker,
  ]);

  // Drain the socket queue in the same commit it arrives in. `useNotificationSync`
  // (mounted higher in the tree) drains the same queue without toasting; child
  // effects run first, so the modal wins only if it does not defer. A deferred
  // drain always found the queue already emptied and no toast ever showed.
  useEffect(() => {
    processSocketNotifications();
  }, [processSocketNotifications]);

  const handleOpenChange = (newlyRequestedOpenState: boolean) => {
    if (!newlyRequestedOpenState && preventAutoClose.current) {
      return;
    }

    setIsOpen(newlyRequestedOpenState);

    if (newlyRequestedOpenState) {
      // Refresh notifications from API if cache is stale
      if (shouldRefresh) {
        loadNotifications();
      }

      preventAutoClose.current = true;

      if (unreadIds.length > 0) {
        markNotificationsAsRead(unreadIds)
          .catch((error) => {
            console.error("❌ [NotificationModal] Failed to mark notifications as read:", error);
          })
          .finally(() => {
            preventAutoClose.current = false;
            // Workaround: re-open if it was open before
            setIsOpen(true);
          });
      } else {
        preventAutoClose.current = false;
      }
      setNewNotifications(false);
    }
  };

  const unreadNotifications = newNotifications && unreadCount > 0;

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange} data-testid={`sidebar-notification button`}>
      {/* The badge overhangs the bell's top-end corner, so nothing between it
          and the sidebar may clip: `overflow-visible` beats the button
          variant's own `overflow-hidden`, and the label is wrapped in its own
          span so the variant's `[&>span:last-child]:truncate` (which sets
          overflow:hidden) lands on the label rather than on the icon slot. */}
      <PopoverTrigger
        render={<SidebarMenuButton className="text-muted-foreground h-6 overflow-visible" disabled={isLoading} />}
      >
        <span className="relative flex shrink-0 items-center justify-center overflow-visible">
          <BellIcon
            className={cn(
              "h-5 w-5 cursor-pointer",
              // Filled, not just tinted: an outline bell in the danger colour
              // is easy to miss at this size, a solid one is not.
              unreadNotifications && "fill-destructive text-destructive",
              isLoading && "animate-pulse",
            )}
          />
          {unreadNotifications && (
            // Fixed px, not rem: the app's root font size is 14px, so a
            // rem-sized badge renders a quarter smaller than the scale implies
            // and the count stops being readable. The ring separates the dot
            // from the bell it sits on.
            <span
              data-testid="sidebar-notification-unread-dot"
              className="bg-destructive ring-sidebar pointer-events-none absolute -top-[3px] -end-[4px] size-[9px] rounded-full ring-2 group-data-[collapsible=icon]:block md:hidden"
            />
          )}
        </span>
        <span className="truncate">{t(`entities.notifications`, { count: 2 })}</span>
        {unreadNotifications && (
          <span
            data-testid="sidebar-notification-unread-count"
            className="bg-destructive text-destructive-foreground pointer-events-none ms-auto flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full px-[5px] text-[11px] leading-none font-semibold tabular-nums group-data-[collapsible=icon]:hidden"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      {/* The popup IS the surface — a Card inside it stacked two paddings
          (Card py-4 + CardHeader p-4) around a 20px title, which is why the
          header was so tall. Widths are in a 14px rem here, so the previous
          w-80 measured 280px on screen, not 320; 30rem = 420px. */}
      <PopoverContent className="relative start-10 w-[30rem] gap-0 overflow-hidden p-0">
        <PopoverHeader className="flex flex-row items-center justify-between gap-2 border-b px-3 py-2">
          {/* Typography role 4 (section header) rather than role 5 (panel
              title): the popover reads as a mini-page, not a card slot. */}
          <PopoverTitle className="text-lg font-semibold">{t(`entities.notifications`, { count: 2 })}</PopoverTitle>
          <Tooltip>
            <TooltipTrigger
              render={
                <Link
                  href={generateUrl({ page: Modules.Notification })}
                  onClick={() => setIsOpen(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                />
              }
            >
              <ExternalLinkIcon className="size-4" />
            </TooltipTrigger>
            <TooltipContent>{t(`notification.all`)}</TooltipContent>
          </Tooltip>
        </PopoverHeader>
        {isLoading && <div className="text-muted-foreground px-3 py-2 text-xs">{t(`common.loading`)}</div>}
        {error && <div className="text-destructive px-3 py-2 text-xs">{error}</div>}
        {/* The cap goes on the scroll viewport, not on the ScrollArea root: the
            viewport carries Base UI's inline overflow and h-full, so a height
            on the root leaves it stretching to its content instead of
            scrolling.
            It is measured against --available-height (set by the positioner,
            after any flip) minus the header, the same way the package combobox
            sizes its list. A fixed cap lets the popup outgrow the room below
            the trigger, and floating-ui's shift() then clamps it into the
            viewport — which is why it landed in the same spot wherever the
            trigger sat, and never scrolled. */}
        {/* The ScrollBar styles itself with data-vertical:w-2.5, but Base UI
            emits data-orientation="vertical" — no data-vertical attribute
            exists, so the track renders 2px wide with a 0px-wide thumb: an
            invisible scrollbar. Forced here by data-slot until the primitive is
            fixed. The thumb's bg-border is also invisible against the popup,
            hence the explicit colour. */}
        <ScrollArea className="[&_[data-slot=scroll-area-scrollbar]]:w-2.5 [&_[data-slot=scroll-area-thumb]]:bg-muted-foreground/40 [&>[data-slot=scroll-area-viewport]]:max-h-[min(32rem,calc(var(--available-height,32rem)-3.5rem))]">
          {notifications.length > 0 ? (
            <div className="divide-border divide-y">
              {notifications.map((notification: NotificationInterface) => (
                <Fragment key={notification.id}>{generateNotification(notification, () => setIsOpen(false))}</Fragment>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground p-6 text-center text-sm">{t(`notification.empty`)}</div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export function NotificationModal(props: NotificationModalProps) {
  return (
    <NotificationErrorBoundary>
      <NotificationModalContent {...props} />
    </NotificationErrorBoundary>
  );
}
