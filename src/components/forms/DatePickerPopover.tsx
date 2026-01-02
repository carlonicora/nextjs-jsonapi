"use client";

import { isValid, parse } from "date-fns";
import { Calendar as CalendarIcon, CircleXIcon } from "lucide-react";
import { ReactNode, useMemo, useState } from "react";
import { useI18nDateFnsLocale, useI18nLocale } from "../../i18n";
import {
  Calendar,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../shadcnui";
import { cn } from "../../utils";

type DatePickerPopoverProps = {
  children: ReactNode;
  value?: Date;
  onSelect: (date?: Date) => void;
  minDate?: Date;
  align?: "start" | "center" | "end";
  className?: string;
};

export const DatePickerPopover = ({
  children,
  value,
  onSelect,
  minDate,
  align = "start",
  className,
}: DatePickerPopoverProps) => {
  const locale = useI18nLocale();
  const dateFnsLocale = useI18nDateFnsLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [displayMonth, setDisplayMonth] = useState<Date>(() => value || new Date());

  // Locale-aware date formatter
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }),
    [locale],
  );

  // Format date for display
  const formatDate = (date: Date): string => dateFormatter.format(date);

  // Get placeholder based on locale format
  const datePlaceholder = useMemo(() => {
    const parts = dateFormatter.formatToParts(new Date(2000, 0, 1));
    return parts
      .map((part) => {
        if (part.type === "day") return "dd";
        if (part.type === "month") return "mm";
        if (part.type === "year") return "yyyy";
        return part.value;
      })
      .join("");
  }, [dateFormatter]);

  // Get date-fns format string from locale
  const dateFormatPattern = useMemo(() => {
    const parts = dateFormatter.formatToParts(new Date(2000, 0, 1));
    return parts
      .map((part) => {
        if (part.type === "day") return "dd";
        if (part.type === "month") return "MM";
        if (part.type === "year") return "yyyy";
        return part.value;
      })
      .join("");
  }, [dateFormatter]);

  const [inputValue, setInputValue] = useState<string>(() => (value ? formatDate(value) : ""));

  // Generate year options (1900 to current year + 10)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 1900 + 11 }, (_, i) => 1900 + i);

  // Generate month names dynamically based on current locale
  const monthNames = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { month: "long" });
    return Array.from({ length: 12 }, (_, i) => {
      const monthName = formatter.format(new Date(2000, i, 1));
      return monthName.charAt(0).toUpperCase() + monthName.slice(1);
    });
  }, [locale]);

  // Handle text input change
  const handleInputChange = (inputValue: string) => {
    setInputValue(inputValue);

    // Try to parse the date using locale format
    const parsedDate = parse(inputValue, dateFormatPattern, new Date());

    if (isValid(parsedDate)) {
      onSelect(parsedDate);
      setDisplayMonth(parsedDate);
    } else if (inputValue === "") {
      onSelect(undefined);
    }
  };

  // Handle calendar selection
  const handleCalendarSelect = (selectedDate: Date | undefined) => {
    onSelect(selectedDate);
    if (selectedDate) {
      setInputValue(formatDate(selectedDate));
      setDisplayMonth(selectedDate);
    } else {
      setInputValue("");
    }
    setIsOpen(false);
  };

  // Handle clear button
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(undefined);
    setInputValue("");
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger>{children}</PopoverTrigger>
      <PopoverContent className={cn("w-auto p-0", className)} align={align} onClick={(e) => e.stopPropagation()}>
        <div className="p-3">
          {/* Manual Input */}
          <div className="relative mb-3">
            <Input
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={datePlaceholder}
              className="pr-16"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center space-x-1">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                onClick={(e) => e.stopPropagation()}
              >
                <CalendarIcon className="h-4 w-4 opacity-50" />
              </button>
              {value && (
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                  onClick={handleClear}
                >
                  <CircleXIcon className="h-4 w-4 opacity-50 hover:opacity-100" />
                </button>
              )}
            </div>
          </div>

          {/* Year and Month Selectors */}
          <div className="mb-3 flex gap-2">
            <Select
              value={displayMonth.getMonth().toString()}
              onValueChange={(value) => {
                if (!value) return;
                const newMonth = parseInt(value);
                const newDate = new Date(displayMonth.getFullYear(), newMonth, 1);
                setDisplayMonth(newDate);
              }}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthNames.map((month, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={displayMonth.getFullYear().toString()}
              onValueChange={(value) => {
                if (!value) return;
                const newYear = parseInt(value);
                const newDate = new Date(newYear, displayMonth.getMonth(), 1);
                setDisplayMonth(newDate);
              }}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.reverse().map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Calendar */}
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleCalendarSelect}
            disabled={(date) => (minDate && date < minDate ? true : false)}
            locale={dateFnsLocale}
            weekStartsOn={1}
            month={displayMonth}
            onMonthChange={setDisplayMonth}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};
