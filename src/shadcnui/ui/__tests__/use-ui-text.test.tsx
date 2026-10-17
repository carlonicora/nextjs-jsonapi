import { render, renderHook, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { configureI18n, type I18nConfig } from "../../../i18n/config";
import { Spinner } from "../spinner";
import { useUiText } from "../use-ui-text";

const catalogue: Record<string, string> = {
  "ui.labels.loading": "Caricamento",
  "ui.labels.more_count": "+{count} altri",
};

/** A next-intl-shaped `t`: `has` probes, missing keys come back as the key path. */
function useCatalogueTranslations() {
  const t = (key: string, values?: Record<string, unknown>) =>
    (catalogue[key] ?? key).replace(/\{(\w+)\}/g, (match, name: string) =>
      values && name in values ? String(values[name]) : match,
    );
  (t as unknown as { has: (key: string) => boolean }).has = (key: string) => key in catalogue;
  return t;
}

function configure(useTranslations: I18nConfig["useTranslations"]) {
  configureI18n({ useTranslations } as unknown as I18nConfig);
}

afterEach(() => {
  configureI18n(null as unknown as I18nConfig);
});

describe("useUiText", () => {
  it("returns the English fallback when i18n is not configured", () => {
    const { result } = renderHook(() => useUiText());
    expect(result.current("ui.labels.close", "Close")).toBe("Close");
    expect(result.current("ui.labels.more_count", "+ {count} more", { count: 2 })).toBe("+ 2 more");
  });

  it("returns the app's translation when the key exists", () => {
    configure(useCatalogueTranslations);
    const { result } = renderHook(() => useUiText());
    expect(result.current("ui.labels.loading", "Loading")).toBe("Caricamento");
    expect(result.current("ui.labels.more_count", "+ {count} more", { count: 3 })).toBe("+3 altri");
  });

  it("returns the English fallback when the app lacks the key", () => {
    configure(useCatalogueTranslations);
    const { result } = renderHook(() => useUiText());
    expect(result.current("ui.labels.close", "Close")).toBe("Close");
  });

  it("returns the English fallback when a has-less t hands back the key path or throws", () => {
    configure(() => (key: string) => key);
    expect(renderHook(() => useUiText()).result.current("ui.labels.close", "Close")).toBe("Close");

    configure(() => () => {
      throw new Error("missing");
    });
    expect(renderHook(() => useUiText()).result.current("ui.labels.close", "Close")).toBe("Close");
  });
});

describe("Spinner label", () => {
  it("announces the translated label, and an explicit aria-label still wins", () => {
    configure(useCatalogueTranslations);
    const { unmount } = render(<Spinner />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Caricamento");
    unmount();

    render(<Spinner aria-label="Saving" />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Saving");
  });

  it("keeps the English label when i18n is not configured", () => {
    render(<Spinner />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Loading");
  });
});
