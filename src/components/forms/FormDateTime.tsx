"use client";

import { Calendar as CalendarIcon, CircleXIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useI18nDateFnsLocale, useI18nLocale, useI18nTranslations } from "../../i18n";
import {
  Button,
  Calendar,
  Label,
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
import { FormFieldWrapper } from "./FormFieldWrapper";

export function FormDateTime({
  form,
  id,
  name,
  minDate,
  onChange,
  allowEmpty,
  defaultMonth,
  placeholder,
  isRequired,
  description,
}: {
  form: any;
  id: string;
  name?: string;
  placeholder?: string;
  minDate?: Date;
  onChange?: (date?: Date) => Promise<void>;
  allowEmpty?: boolean;
  defaultMonth?: Date;
  isRequired?: boolean;
  description?: string;
}) {
  const [open, setOpen] = useState<boolean>(false);
  const t = useI18nTranslations();
  const locale = useI18nLocale();
  const dateFnsLocale = useI18nDateFnsLocale();

  const [displayMonth, setDisplayMonth] = useState<Date>(() => {
    const currentValue = form.getValues(id);
    return currentValue || defaultMonth || new Date();
  });

  // Locale-aware date-time formatter
  const dateTimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    [locale],
  );

  // Format date-time for display
  const formatDateTime = (date: Date): string => dateTimeFormatter.format(date);

  const [selectedHours, setSelectedHours] = useState<number>(new Date().getHours());
  const [selectedMinutes, setSelectedMinutes] = useState<number>(roundToNearestFiveMinutes(new Date().getMinutes()));

  const hoursOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    return {
      value: hour,
      label: hour.toString().padStart(2, "0"),
    };
  });

  const minutesOptions = Array.from({ length: 12 }, (_, i) => {
    const minute = i * 5;
    return {
      value: minute,
      label: minute.toString().padStart(2, "0"),
    };
  });

  const hoursItems = Object.fromEntries(hoursOptions.map((option) => [String(option.value), option.label]));
  const minutesItems = Object.fromEntries(minutesOptions.map((option) => [String(option.value), option.label]));

  function roundToNearestFiveMinutes(minutes: number): number {
    return (Math.round(minutes / 5) * 5) % 60;
  }

  const handleTimeChange = (hours: number, minutes: number) => {
    const currentDate = form.getValues(id);
    if (currentDate) {
      const updatedDate = new Date(currentDate);
      updatedDate.setHours(hours);
      updatedDate.setMinutes(minutes);
      form.setValue(id, updatedDate);
      if (onChange) onChange(updatedDate);
    }
  };

  return (
    <div className="flex w-full flex-col">
      <FormFieldWrapper form={form} name={id} label={name} isRequired={isRequired} description={description}>
        {(field) => (
          <div className="relative flex flex-row">
            <Popover open={open} onOpenChange={setOpen} modal={true}>
              <div className="flex w-full flex-row items-center justify-between">
                <PopoverTrigger
                  render={
                    <Button
                      variant={"outline"}
                      className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                    />
                  }
                >
                  {field.value ? (
                    formatDateTime(field.value)
                  ) : (
                    <span>{placeholder ? placeholder : t(`common.pick_date_time`)}</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </PopoverTrigger>
                {field.value && allowEmpty !== false && (
                  <CircleXIcon
                    className="text-muted hover:text-destructive ml-2 h-6 w-6 cursor-pointer"
                    onClick={() => {
                      if (onChange) onChange(undefined);
                      form.setValue(id, "");
                    }}
                  />
                )}
              </div>
              <PopoverContent className="w-auto p-4" align="start">
                <div className="flex flex-col space-y-4">
                  <Calendar
                    mode="single"
                    captionLayout="dropdown"
                    selected={field.value}
                    month={displayMonth}
                    onMonthChange={setDisplayMonth}
                    onSelect={(date) => {
                      if (date) {
                        // Preserve the current time when selecting a new date
                        const newDate = new Date(date);
                        if (field.value) {
                          const currentDate = new Date(field.value);
                          newDate.setHours(currentDate.getHours(), currentDate.getMinutes());
                        } else {
                          newDate.setHours(selectedHours, selectedMinutes);
                        }
                        form.setValue(id, newDate);
                        setDisplayMonth(newDate);
                        if (onChange) onChange(newDate);

                        // Update time state values
                        setSelectedHours(newDate.getHours());
                        setSelectedMinutes(roundToNearestFiveMinutes(newDate.getMinutes()));
                      }
                    }}
                    disabled={(date) => (minDate && date < minDate ? true : false)}
                    locale={dateFnsLocale}
                    weekStartsOn={1}
                    startMonth={new Date(1900, 0)}
                    endMonth={new Date(new Date().getFullYear() + 10, 11)}
                  />
                  <div className="flex flex-row items-end justify-center space-x-4">
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="hours-select">{t(`common.hours`)}</Label>
                      <Select
                        items={hoursItems}
                        value={String(field.value ? new Date(field.value).getHours() : selectedHours)}
                        onValueChange={(value) => {
                          if (!value) return;
                          const hours = parseInt(value);
                          setSelectedHours(hours);
                          handleTimeChange(
                            hours,
                            field.value
                              ? roundToNearestFiveMinutes(new Date(field.value).getMinutes())
                              : selectedMinutes,
                          );
                        }}
                      >
                        <SelectTrigger id="hours-select" className="w-[70px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {hoursOptions.map((option) => (
                            <SelectItem key={option.value} value={String(option.value)}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="mb-[9px] text-xl">:</div>
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="minutes-select">{t(`common.minutes`)}</Label>
                      <Select
                        items={minutesItems}
                        value={String(
                          field.value ? roundToNearestFiveMinutes(new Date(field.value).getMinutes()) : selectedMinutes,
                        )}
                        onValueChange={(value) => {
                          if (!value) return;
                          const minutes = parseInt(value);
                          setSelectedMinutes(minutes);
                          handleTimeChange(field.value ? new Date(field.value).getHours() : selectedHours, minutes);
                        }}
                      >
                        <SelectTrigger id="minutes-select" className="w-[70px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {minutesOptions.map((option) => (
                            <SelectItem key={option.value} value={String(option.value)}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-row gap-x-2">
                    {allowEmpty !== false && (
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        disabled={!field.value}
                        onClick={() => {
                          if (onChange) onChange(undefined);
                          form.setValue(id, "");
                          setOpen(false);
                        }}
                      >
                        {t(`ui.buttons.clear`)}
                      </Button>
                    )}
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={() => {
                        setOpen(false);
                      }}
                    >
                      {t(`ui.buttons.select_date`)}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </FormFieldWrapper>
    </div>
  );
}
