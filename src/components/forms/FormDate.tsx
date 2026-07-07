"use client";

import { isValid, parse } from "date-fns";
import { Calendar as CalendarIcon, CircleXIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useI18nDateFnsLocale, useI18nLocale, useI18nTranslations } from "../../i18n";
import {
  Button,
  Calendar,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../shadcnui";
import { FormFieldWrapper } from "./FormFieldWrapper";

export function FormDate({
  form,
  id,
  name,
  minDate,
  onChange,
  isRequired = false,
  defaultMonth,
  allowEmpty,
  description,
  futureYears,
}: {
  form: any;
  id: string;
  name?: string;
  placeholder?: string;
  minDate?: Date;
  onChange?: (date?: Date) => Promise<void>;
  isRequired?: boolean;
  defaultMonth?: Date;
  allowEmpty?: boolean;
  description?: string;
  futureYears?: number;
}) {
  const t = useI18nTranslations();
  const locale = useI18nLocale();
  const dateFnsLocale = useI18nDateFnsLocale();
  const [open, setOpen] = useState<boolean>(false);
  const [displayMonth, setDisplayMonth] = useState<Date>(() => {
    const currentValue = form.getValues(id);
    return currentValue || defaultMonth || new Date();
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
      <FormFieldWrapper form={form} name={id} label={name} isRequired={isRequired} description={description}>
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
                {field.value && allowEmpty !== false && (
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
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                captionLayout="dropdown"
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
                startMonth={new Date(1900, 0)}
                endMonth={new Date(new Date().getFullYear() + (futureYears ?? 10), 11)}
              />
              {allowEmpty !== false && (
                <div className="border-t p-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={!field.value}
                    onClick={() => {
                      field.onChange(undefined);
                      setInputValue("");
                      if (onChange) onChange(undefined);
                      setOpen(false);
                    }}
                  >
                    {t(`ui.buttons.clear`)}
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        )}
      </FormFieldWrapper>
    </div>
  );
}
