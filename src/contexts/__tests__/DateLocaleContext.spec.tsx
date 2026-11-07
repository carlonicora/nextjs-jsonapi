import { act, render, screen } from "@testing-library/react";
import { Suspense, useEffect, useSyncExternalStore } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { configureI18n } from "../../i18n/config";
import type { SessionSnapshot } from "../../server/ServerSession";
import {
  type DateLocaleSource,
  DateLocaleProvider,
  DateLocaleSourceProvider,
  useDateFormatter,
  useDateLocaleSource,
  useMountedNow,
} from "../DateLocaleContext";

const sample = new Date("2026-04-25T21:30:00Z");

let appLocale = "en";
const listeners = new Set<() => void>();
const setAppLocale = (next: string) => {
  appLocale = next;
  listeners.forEach((listener) => listener());
};
const useStubLocale = () =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => appLocale,
  );

const snapshot = (acceptLanguage?: string): SessionSnapshot => ({
  isLogged: true,
  isAdministrator: false,
  sidebarOpen: true,
  isMobile: false,
  acceptLanguage,
});

function Probe() {
  const { format, locale, isPublic } = useDateFormatter();
  return (
    <span data-testid="probe" data-locale={locale} data-public={String(isPublic)}>
      {format(sample, "date", { timeZone: "UTC" })}
    </span>
  );
}

beforeEach(() => {
  appLocale = "en";
  configureI18n({
    useRouter: () => ({
      push: () => {},
      replace: () => {},
      back: () => {},
      forward: () => {},
      refresh: () => {},
      prefetch: () => {},
    }),
    useTranslations: () => (key: string) => key,
    useLocale: useStubLocale,
    Link: ({ children }) => <>{children}</>,
    usePathname: () => "/",
    getLocale: async () => appLocale,
  });
});

describe("DateLocaleProvider", () => {
  it("resolves the browser's regional locale from the session", async () => {
    const session = Promise.resolve(snapshot("en-GB"));
    await act(async () => {
      render(
        <DateLocaleProvider session={session}>
          <Suspense fallback={<span>loading</span>}>
            <Probe />
          </Suspense>
        </DateLocaleProvider>,
      );
    });
    expect(await screen.findByTestId("probe")).toHaveTextContent("25/04/2026");
    expect(screen.getByTestId("probe")).toHaveAttribute("data-locale", "en-GB");
  });

  it("uses the app language and month-as-word in public mode", () => {
    render(
      <DateLocaleProvider mode="public">
        <Probe />
      </DateLocaleProvider>,
    );
    // Rule 3: the app language ("en"), never the browser's region; numeric "date" becomes dateMedium.
    expect(screen.getByTestId("probe")).toHaveTextContent("Apr 25, 2026");
    expect(screen.getByTestId("probe")).toHaveAttribute("data-public", "true");
    expect(screen.getByTestId("probe")).toHaveAttribute("data-locale", "en");
  });

  it("falls back to the app language without a provider", () => {
    render(<Probe />);
    expect(screen.getByTestId("probe")).toHaveTextContent("04/25/2026");
    expect(screen.getByTestId("probe")).toHaveAttribute("data-public", "false");
  });

  it("useDateLocale re-resolves when the app locale changes", async () => {
    const session = Promise.resolve(snapshot("en-US,en;q=0.9"));
    await act(async () => {
      render(
        <DateLocaleProvider session={session}>
          <Suspense fallback={<span>loading</span>}>
            <Probe />
          </Suspense>
        </DateLocaleProvider>,
      );
    });
    expect(await screen.findByTestId("probe")).toHaveTextContent("04/25/2026");

    act(() => setAppLocale("it"));

    expect(screen.getByTestId("probe")).toHaveTextContent("25/04/2026");
    expect(screen.getByTestId("probe")).toHaveAttribute("data-locale", "it");
  });
});

describe("useDateLocaleSource + DateLocaleSourceProvider", () => {
  it("re-provides a captured source to a tree mounted outside the provider", async () => {
    let captured: DateLocaleSource | null = null;
    function Capture() {
      captured = useDateLocaleSource();
      return null;
    }
    const session = Promise.resolve(snapshot("en-GB"));
    await act(async () => {
      render(
        <DateLocaleProvider session={session}>
          <Capture />
        </DateLocaleProvider>,
      );
    });
    expect(captured).not.toBeNull();

    await act(async () => {
      render(
        <DateLocaleSourceProvider value={captured}>
          <Suspense fallback={<span>loading</span>}>
            <Probe />
          </Suspense>
        </DateLocaleSourceProvider>,
      );
    });
    expect(await screen.findByTestId("probe")).toHaveTextContent("25/04/2026");
  });
});

describe("useMountedNow", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("useMountedNow is undefined until mounted", () => {
    vi.useFakeTimers();
    vi.setSystemTime(sample);
    const seen: Array<Date | undefined> = [];
    function NowProbe() {
      const now = useMountedNow();
      useEffect(() => {
        seen.push(now);
      });
      seen.push(now);
      return null;
    }
    render(<NowProbe />);
    expect(seen[0]).toBeUndefined();
    const last = seen[seen.length - 1];
    expect(last).toBeInstanceOf(Date);
    expect(last?.getTime()).toBe(sample.getTime());
  });
});
