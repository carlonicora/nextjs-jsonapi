import { render, screen } from "@testing-library/react";
import { enUS, it as italian } from "date-fns/locale";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../../../messages/en.json";
import itMessages from "../../../../messages/it.json";
import { configureI18n, type I18nConfig } from "../../../i18n/config";
import { Calendar } from "../calendar";

// vitest.setup.ts replaces next-intl with a stub whose t() returns the key. This spec pins the
// real texts, so it reads the real next-intl and the library's own message files.
vi.mock("next-intl", async () => await vi.importActual<typeof import("next-intl")>("next-intl"));

const OCTOBER_2026 = new Date(2026, 9, 1);
const TODAY = new Date(2026, 9, 15);

function renderIn(locale: "en" | "it", ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale={locale} messages={locale === "it" ? itMessages : en} timeZone="Europe/Rome">
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("ui.calendar messages", () => {
  it.each([
    ["previous_month", "Go to the previous month", "Vai al mese precedente"],
    ["next_month", "Go to the next month", "Vai al mese successivo"],
    ["navigation", "Navigation bar", "Barra di navigazione"],
    ["choose_month", "Choose the month", "Scegli il mese"],
    ["choose_year", "Choose the year", "Scegli l'anno"],
    ["today", "Today, {date}", "Oggi, {date}"],
    ["selected", "{date}, selected", "{date}, selezionato"],
    ["week_number", "Week {number}", "Settimana {number}"],
    ["week_number_header", "Week number", "Numero settimana"],
  ] as const)("%s has its English and Italian text", (key, english, italianText) => {
    expect(en.ui.calendar[key]).toBe(english);
    expect(itMessages.ui.calendar[key]).toBe(italianText);
  });

  it("holds exactly the nine keys, in the same order in both files", () => {
    const keys = [
      "choose_month",
      "choose_year",
      "navigation",
      "next_month",
      "previous_month",
      "selected",
      "today",
      "week_number",
      "week_number_header",
    ];
    expect(Object.keys(en.ui.calendar)).toEqual(keys);
    expect(Object.keys(itMessages.ui.calendar)).toEqual(keys);
  });
});

// The calendar never imports next-intl: it reads the `useTranslations` the host app hands to
// configureI18n(), through useUiText. Here the host app is next-intl itself.
function configure(translations: unknown) {
  configureI18n((translations ? { useTranslations: translations } : null) as unknown as I18nConfig);
}

afterEach(() => configure(null));

describe("Calendar labels without the app's texts", () => {
  it("renders react-day-picker's English texts when i18n is not configured, with no provider", () => {
    render(
      <Calendar
        mode="single"
        locale={enUS}
        month={OCTOBER_2026}
        today={TODAY}
        selected={new Date(2026, 9, 3)}
        onSelect={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: "Go to the Previous Month" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go to the Next Month" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Today, Thursday, October 15th, 2026" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Saturday, October 3rd, 2026, selected" })).toBeInTheDocument();
  });

  it("renders the English texts when the app's messages have no calendar keys", () => {
    configure(useTranslations);
    render(
      <NextIntlClientProvider locale="it" messages={{ ui: { labels: { close: "Chiudi" } } }} timeZone="Europe/Rome">
        <Calendar locale={italian} month={OCTOBER_2026} today={TODAY} showWeekNumber />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole("button", { name: "Go to the Previous Month" })).toBeInTheDocument();
    expect(screen.getByLabelText("Week Number")).toBeInTheDocument();
    expect(screen.getByLabelText("Week 40")).toBeInTheDocument();
    expect(screen.queryByText(/ui\.calendar/)).not.toBeInTheDocument();
  });
});

describe("Calendar labels", () => {
  beforeEach(() => configure(useTranslations));

  it("names the previous button in Italian", () => {
    renderIn("it", <Calendar locale={italian} month={OCTOBER_2026} today={TODAY} />);

    expect(screen.getByRole("button", { name: "Vai al mese precedente" })).toBeInTheDocument();
  });

  it("names the next button and the navigation bar in Italian", () => {
    renderIn("it", <Calendar locale={italian} month={OCTOBER_2026} today={TODAY} />);

    expect(screen.getByRole("button", { name: "Vai al mese successivo" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Barra di navigazione" })).toBeInTheDocument();
  });

  it("prefixes today's day button", () => {
    renderIn("it", <Calendar mode="single" locale={italian} month={OCTOBER_2026} today={TODAY} />);

    expect(screen.getByRole("button", { name: "Oggi, giovedì 15 ottobre 2026" })).toBeInTheDocument();
  });

  it("names a plain day with the date in the given locale only", () => {
    renderIn("it", <Calendar mode="single" locale={italian} month={OCTOBER_2026} today={TODAY} />);

    expect(screen.getByRole("button", { name: "sabato 3 ottobre 2026" })).toBeInTheDocument();
  });

  it("suffixes a selected day", () => {
    renderIn(
      "it",
      <Calendar
        mode="single"
        locale={italian}
        month={OCTOBER_2026}
        today={TODAY}
        selected={new Date(2026, 9, 3)}
        onSelect={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: "sabato 3 ottobre 2026, selezionato" })).toBeInTheDocument();
  });

  it("prefixes and suffixes a day that is both today and selected", () => {
    renderIn(
      "it",
      <Calendar
        mode="single"
        locale={italian}
        month={OCTOBER_2026}
        today={TODAY}
        selected={TODAY}
        onSelect={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: "Oggi, giovedì 15 ottobre 2026, selezionato" })).toBeInTheDocument();
  });

  it("prefixes today's cell when the calendar has no selection mode", () => {
    renderIn("it", <Calendar locale={italian} month={OCTOBER_2026} today={TODAY} />);

    expect(screen.getByRole("gridcell", { name: "Oggi, giovedì 15 ottobre 2026" })).toBeInTheDocument();
    expect(screen.getByRole("gridcell", { name: "sabato 3 ottobre 2026" })).toBeInTheDocument();
  });

  it("names the month and year dropdowns in Italian", () => {
    renderIn(
      "it",
      <Calendar
        locale={italian}
        month={OCTOBER_2026}
        today={TODAY}
        captionLayout="dropdown"
        startMonth={new Date(2025, 0, 1)}
        endMonth={new Date(2027, 11, 1)}
      />,
    );

    expect(screen.getByRole("combobox", { name: "Scegli il mese" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Scegli l'anno" })).toBeInTheDocument();
  });

  it("names the week numbers and their column in Italian", () => {
    renderIn("it", <Calendar locale={italian} month={OCTOBER_2026} today={TODAY} showWeekNumber />);

    // react-day-picker hides the weekday row from the accessibility tree, so the header is read by its label.
    expect(screen.getByLabelText("Numero settimana")).toBeInTheDocument();
    expect(screen.getByLabelText("Settimana 40")).toBeInTheDocument();
  });

  it("renders the English texts with the English messages", () => {
    renderIn(
      "en",
      <Calendar
        mode="single"
        locale={enUS}
        month={OCTOBER_2026}
        today={TODAY}
        selected={new Date(2026, 9, 3)}
        onSelect={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: "Go to the previous month" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go to the next month" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Today, Thursday, October 15th, 2026" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Saturday, October 3rd, 2026, selected" })).toBeInTheDocument();
  });

  it("lets a caller's labels prop win, and keeps the other labels translated", () => {
    renderIn(
      "it",
      <Calendar locale={italian} month={OCTOBER_2026} today={TODAY} labels={{ labelPrevious: () => "Indietro" }} />,
    );

    expect(screen.getByRole("button", { name: "Indietro" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Vai al mese precedente" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Vai al mese successivo" })).toBeInTheDocument();
  });
});
