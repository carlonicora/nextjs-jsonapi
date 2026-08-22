"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import { useI18nDateFnsLocale } from "../../i18n";
import { Button, Calendar, Popover, PopoverContent, PopoverTrigger } from "../../shadcnui";
import { cn } from "../../utils";

/**
 * Decides the range to hold after react-day-picker reports a selection.
 *
 * react-day-picker's `addToRange` NEVER moves `from` when the current range is
 * already COMPLETE and the clicked day falls after it — it returns
 * `{ from, to: clickedDay }` (see its `from && to` branch). So "did `from`
 * change?" cannot distinguish "the user is starting a new range" from "the user
 * moved the end": it is true only for a click BEFORE `from`.
 *
 * That is the asymmetry this component shipped with. Its default range is the
 * whole CURRENT month, so clicking any day in the current month landed after
 * `from` and silently became the END date — the start could never be moved
 * forward — while clicking a day in a PAST month fell before `from`, changed it,
 * and appeared to work.
 *
 * A click on a complete range therefore starts a NEW range at the clicked day,
 * which is the conventional range-picker behaviour. `triggerDate` is the day
 * react-day-picker reports as the one that was clicked (`onSelect`'s second
 * argument) — the only reliable source for it, since the computed range hides it.
 */
export function nextDateRange(params: {
  current: DateRange | undefined;
  computed: DateRange | undefined;
  triggerDate: Date;
}): DateRange | undefined {
  const { current, computed, triggerDate } = params;
  // react-day-picker returns undefined to DESELECT (clicking the only selected
  // day of a single-day range). Honour that before anything else.
  if (!computed) return undefined;
  if (current?.from && current?.to) return { from: triggerDate, to: undefined };
  return computed;
}

type DateRangeSelectorProps = {
  onDateChange: (date?: DateRange) => void;
  avoidSettingDates?: boolean;
  showPreviousMonth?: boolean;
};

export function DateRangeSelector({ onDateChange, avoidSettingDates, showPreviousMonth }: DateRangeSelectorProps) {
  const t = useTranslations();
  const dateFnsLocale = useI18nDateFnsLocale();
  const [date, setDate] = useState<DateRange | undefined>(
    avoidSettingDates
      ? undefined
      : {
          from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
        },
  );

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering Popover after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const [prevRange, setPrevRange] = useState<DateRange | undefined>(date);
  useEffect(() => {
    if (
      date?.from &&
      date?.to &&
      date.to > date.from &&
      (prevRange?.from?.getTime() !== date.from.getTime() || prevRange?.to?.getTime() !== date.to.getTime())
    ) {
      onDateChange(date);
      setPrevRange(date);
      setOpen(false);
    }
  }, [date, prevRange, onDateChange]);

  // A click on an already-complete range starts a new one — see nextDateRange().
  const handleSelect = (range: DateRange | undefined, triggerDate: Date) => {
    setDate(nextDateRange({ current: date, computed: range, triggerDate }));
  };

  // Show placeholder button during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className={cn("grid gap-2")}>
        <Button
          id="date"
          variant={"outline"}
          className={cn("w-[300px] justify-start text-left font-normal", !date && "text-muted-foreground")}
        >
          <CalendarIcon />
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, "d MMM yyyy", { locale: dateFnsLocale })} -{" "}
                {format(date.to, "d MMM yyyy", { locale: dateFnsLocale })}
              </>
            ) : (
              format(date.from, "d MMM yyyy", { locale: dateFnsLocale })
            )
          ) : (
            <span>{t("ui.labels.pick_a_date")}</span>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("grid gap-2")}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id="date"
              variant={"outline"}
              className={cn("w-[300px] justify-start text-left font-normal", !date && "text-muted-foreground")}
            />
          }
        >
          <CalendarIcon />
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, "d MMM yyyy", { locale: dateFnsLocale })} -{" "}
                {format(date.to, "d MMM yyyy", { locale: dateFnsLocale })}
              </>
            ) : (
              format(date.from, "d MMM yyyy", { locale: dateFnsLocale })
            )
          ) : (
            <span>{t("ui.labels.pick_a_date")}</span>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col gap-2 p-2">
            <Calendar
              mode="range"
              defaultMonth={
                date?.from ??
                (showPreviousMonth ? new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1) : undefined)
              }
              selected={date}
              onSelect={handleSelect}
              numberOfMonths={2}
            />
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setDate(undefined);
                setPrevRange(undefined);
                onDateChange(undefined);
                setOpen(false);
              }}
              className="cursor-pointer"
              disabled={!date}
            >
              {t("ui.buttons.clear")}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
