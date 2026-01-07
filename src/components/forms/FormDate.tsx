"use client";

import { isValid, parse } from "date-fns";
import { Calendar as CalendarIcon, CircleXIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useI18nDateFnsLocale, useI18nLocale } from "../../i18n";
import {
  Calendar,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../shadcnui";
import { FormFieldWrapper } from "./FormFieldWrapper";

export function FormDate({
  form,
  id,
  name,
  minDate,
  onChange,
  isRequired = false,
}: {
  form: any;
  id: string;
  name?: string;
  placeholder?: string;
  minDate?: Date;
  onChange?: (date?: Date) => Promise<void>;
  isRequired?: boolean;
}) {
  const locale = useI18nLocale();
  const dateFnsLocale = useI18nDateFnsLocale();
  const [open, setOpen] = useState<boolean>(false);
  const [displayMonth, setDisplayMonth] = useState<Date>(() => {
    const currentValue = form.getValues(id);
    return currentValue || new Date();
  });

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

  const [inputValue, setInputValue] = useState<string>(() => {
    const currentValue = form.getValues(id);
    return currentValue ? formatDate(currentValue) : "";
  });

  // Generate year options (1900 to current year)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => 1900 + i);

  // Generate month names dynamically based on current locale
  const monthNames = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { month: "long" });
    return Array.from({ length: 12 }, (_, i) => {
      const monthName = formatter.format(new Date(2000, i, 1));
      return monthName.charAt(0).toUpperCase() + monthName.slice(1);
    });
  }, [locale]);

  // Handle text input change
  const handleInputChange = (value: string, field: any) => {
    setInputValue(value);

    // Try to parse the date using locale format
    const parsedDate = parse(value, dateFormatPattern, new Date());

    if (isValid(parsedDate)) {
      field.onChange(parsedDate);
      setDisplayMonth(parsedDate);
      if (onChange) onChange(parsedDate);
    } else if (value === "") {
      field.onChange(undefined);
      if (onChange) onChange(undefined);
    }
  };

  // Handle calendar selection
  const handleCalendarSelect = (selectedDate: Date | undefined, field: any) => {
    field.onChange(selectedDate);
    if (selectedDate) {
      setInputValue(formatDate(selectedDate));
      setDisplayMonth(selectedDate);
    } else {
      setInputValue("");
    }
    if (onChange) onChange(selectedDate);
  };

  return (
    <div className="flex w-full flex-col">
      <FormFieldWrapper
        form={form}
        name={id}
        label={name}
        isRequired={isRequired}
      >
        {(field) => (
          <Popover open={open} onOpenChange={setOpen} modal={true}>
            <InputGroup>
              <InputGroupInput
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value, field)}
                placeholder={datePlaceholder}
              />
              <InputGroupAddon align="inline-end">
                <PopoverTrigger render={<div />} nativeButton={false}>
                  <InputGroupButton variant="ghost" size="icon-xs">
                    <CalendarIcon className="h-4 w-4 opacity-50" />
                  </InputGroupButton>
                </PopoverTrigger>
                {field.value && (
                  <InputGroupButton
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => {
                      field.onChange(undefined);
                      setInputValue("");
                      if (onChange) onChange(undefined);
                    }}
                  >
                    <CircleXIcon className="h-4 w-4 opacity-50 hover:opacity-100" />
                  </InputGroupButton>
                )}
              </InputGroupAddon>
            </InputGroup>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3">
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
                  selected={field.value}
                  onSelect={(e) => {
                    handleCalendarSelect(e, field);
                    setOpen(false);
                  }}
                  disabled={(date) => (minDate && date < minDate ? true : false)}
                  locale={dateFnsLocale}
                  weekStartsOn={1}
                  month={displayMonth}
                  onMonthChange={setDisplayMonth}
                />
              </div>
            </PopoverContent>
          </Popover>
        )}
      </FormFieldWrapper>
    </div>
  );
}
