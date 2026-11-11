"use client";

import * as React from "react";
import { DateLib, DayPicker, getDefaultClassNames, type DayButton, type Labels } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from "lucide-react";
import { useDir } from "../../contexts/DirectionContext";
import { useUiText } from "./use-ui-text";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  labels,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const defaultClassNames = getDefaultClassNames();
  const dir = useDir();
  const uiText = useUiText();

  // The accessible names react-day-picker builds, in the active language. Each falls back to
  // react-day-picker's own English text when the app has no translation for it. The date part
  // keeps react-day-picker's own format(date, "PPPP") in the locale the caller passed.
  const translatedLabels: Partial<Labels> = {
    labelPrevious: () => uiText("ui.calendar.previous_month", "Go to the Previous Month"),
    labelNext: () => uiText("ui.calendar.next_month", "Go to the Next Month"),
    labelNav: () => uiText("ui.calendar.navigation", ""),
    labelMonthDropdown: () => uiText("ui.calendar.choose_month", "Choose the Month"),
    labelYearDropdown: () => uiText("ui.calendar.choose_year", "Choose the Year"),
    labelDayButton: (date, modifiers, options, dateLib) => {
      let label = (dateLib ?? new DateLib(options)).format(date, "PPPP");
      if (modifiers.today) label = uiText("ui.calendar.today", "Today, {date}", { date: label });
      if (modifiers.selected) label = uiText("ui.calendar.selected", "{date}, selected", { date: label });
      return label;
    },
    labelGridcell: (date, modifiers, options, dateLib) => {
      const label = (dateLib ?? new DateLib(options)).format(date, "PPPP");
      return modifiers?.today ? uiText("ui.calendar.today", "Today, {date}", { date: label }) : label;
    },
    labelWeekNumber: (weekNumber) => uiText("ui.calendar.week_number", "Week {number}", { number: weekNumber }),
    labelWeekNumberHeader: () => uiText("ui.calendar.week_number_header", "Week Number"),
  };

  return (
    <DayPicker
      dir={dir}
      showOutsideDays={showOutsideDays}
      className={cn(
        "p-3 [--cell-radius:var(--radius-md)] [--cell-size:--spacing(6)] bg-background group/calendar [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
        className,
      )}
      captionLayout={captionLayout}
      labels={{ ...translatedLabels, ...labels }}
      formatters={{
        formatMonthDropdown: (date) => date.toLocaleString(props.locale?.code ?? "default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn("flex gap-4 flex-col md:flex-row relative", defaultClassNames.months),
        month: cn("flex flex-col w-full gap-4", defaultClassNames.month),
        nav: cn("flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between", defaultClassNames.nav),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) aria-disabled:opacity-50 p-0 select-none",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) aria-disabled:opacity-50 p-0 select-none",
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          "flex items-center justify-center h-(--cell-size) w-full px-(--cell-size)",
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          "w-full flex items-center text-sm font-medium justify-center h-(--cell-size) gap-1.5",
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn(
          "relative cn-calendar-dropdown-root rounded-(--cell-radius)",
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn("absolute bg-popover inset-0 opacity-0", defaultClassNames.dropdown),
        caption_label: cn(
          "select-none font-medium",
          captionLayout === "label"
            ? "text-sm"
            : "cn-calendar-caption-label rounded-(--cell-radius) flex items-center gap-1 text-sm  [&>svg]:text-muted-foreground [&>svg]:size-3.5",
          defaultClassNames.caption_label,
        ),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground rounded-(--cell-radius) flex-1 font-normal text-xs select-none",
          defaultClassNames.weekday,
        ),
        week: cn("flex w-full mt-2", defaultClassNames.week),
        week_number_header: cn("select-none w-(--cell-size)", defaultClassNames.week_number_header),
        week_number: cn("text-xs select-none text-muted-foreground", defaultClassNames.week_number),
        day: cn(
          "relative w-full rounded-(--cell-radius) h-full p-0 text-center [&:last-child[data-selected=true]_button]:rounded-e-(--cell-radius) group/day aspect-square select-none",
          props.showWeekNumber
            ? "[&:nth-child(2)[data-selected=true]_button]:rounded-s-(--cell-radius)"
            : "[&:first-child[data-selected=true]_button]:rounded-s-(--cell-radius)",
          defaultClassNames.day,
        ),
        range_start: cn(
          "rounded-s-(--cell-radius) bg-muted elative after:bg-muted after:absolute after:inset-y-0 after:w-4 after:end-0 -z-0 isolate",
          defaultClassNames.range_start,
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn(
          "rounded-e-(--cell-radius) bg-muted relative after:bg-muted after:absolute after:inset-y-0 after:w-4 after:start-0 -z-0 isolate",
          defaultClassNames.range_end,
        ),
        today: cn(
          "bg-muted text-foreground rounded-(--cell-radius) data-[selected=true]:rounded-none",
          defaultClassNames.today,
        ),
        outside: cn("text-muted-foreground aria-selected:text-muted-foreground", defaultClassNames.outside),
        disabled: cn("text-muted-foreground opacity-50", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return <div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />;
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return <ChevronLeftIcon className={cn("size-4", className)} {...props} />;
          }

          if (orientation === "right") {
            return <ChevronRightIcon className={cn("size-4", className)} {...props} />;
          }

          return <ChevronDownIcon className={cn("size-4", className)} {...props} />;
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">{children}</div>
            </td>
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({ className, day, modifiers, ...props }: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-muted data-[range-middle=true]:text-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-foreground relative isolate z-10 flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 border-0 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-(--cell-radius) data-[range-end=true]:rounded-e-(--cell-radius) data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-(--cell-radius) data-[range-start=true]:rounded-s-(--cell-radius) [&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        className,
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
