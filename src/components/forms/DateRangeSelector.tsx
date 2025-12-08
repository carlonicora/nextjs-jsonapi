"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import { Button, Calendar, Popover, PopoverContent, PopoverTrigger } from "../../shadcnui";
import { cn } from "../../utils";

type DateRangeSelectorProps = {
  onDateChange: (date?: DateRange) => void;
  avoidSettingDates?: boolean;
  showPreviousMonth?: boolean;
};

export function DateRangeSelector({ onDateChange, avoidSettingDates, showPreviousMonth }: DateRangeSelectorProps) {
  const [date, setDate] = useState<DateRange | undefined>(
    avoidSettingDates
      ? undefined
      : {
          from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
        },
  );

  const [open, setOpen] = useState(false);

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

  // Custom handler to reset end date if a new start date is picked
  const handleSelect = (range: DateRange | undefined) => {
    if (!range) {
      setDate(undefined);
      return;
    }
    // If a new start date is picked, reset end date
    if (range.from && (!date?.from || range.from.getTime() !== date.from.getTime())) {
      setDate({ from: range.from, to: undefined });
    } else {
      setDate(range);
    }
  };

  return (
    <div className={cn("grid gap-2")}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn("w-[300px] justify-start text-left font-normal", !date && "text-muted-foreground")}
          >
            <CalendarIcon />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
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
              Clear
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
