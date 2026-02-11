"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { CheckIcon, ChevronDown, Loader2, WandSparkles, XCircle, XIcon } from "lucide-react";
import * as React from "react";

import { cn } from "../../utils/cn";
import { Badge } from "../ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Separator } from "../ui/separator";

/**
 * Variants for the multi-select component to handle different styles.
 * Uses class-variance-authority (cva) to define different styles based on "variant" prop.
 */
const multiSelectVariants = cva(
  "m-1 transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-300",
  {
    variants: {
      variant: {
        default: "border-foreground/10 text-foreground bg-card hover:bg-card/80",
        secondary: "border-foreground/10 bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        inverted: "inverted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

/**
 * Props for MultiSelect component
 */
interface MultiSelectProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof multiSelectVariants> {
  /**
   * An array of option objects to be displayed in the multi-select component.
   * Each option object has a label, value, and an optional icon.
   */
  options: {
    /** The text to display for the option in the dropdown. */
    label: string;
    /** The unique value associated with the option. */
    value: string;
    /** Optional text to display when selected (in badges). Falls back to label if not provided. */
    selectedLabel?: string;
    /** Optional icon component to display alongside the option. */
    icon?: React.ComponentType<{ className?: string }>;
    /** Optional custom className for the icon. */
    iconClassName?: string;
  }[];

  /**
   * Callback function triggered when the selected values change.
   * Receives an array of the new selected values.
   */
  onValueChange: (value: string[]) => void;

  /** The default selected values when the component mounts. */
  defaultValue?: string[];

  /**
   * The controlled value for the component. When provided, the component
   * will be controlled rather than using internal state.
   */
  value?: string[];

  /**
   * Placeholder text to be displayed when no values are selected.
   * Optional, defaults to "Select options".
   */
  placeholder?: string;

  /**
   * Animation duration in seconds for the visual effects (e.g., bouncing badges).
   * Optional, defaults to 0 (no animation).
   */
  animation?: number;

  /**
   * Maximum number of items to display. Extra selected items will be summarized.
   * Optional, defaults to 3.
   */
  maxCount?: number;

  /**
   * The modality of the popover. When set to true, interaction with outside elements
   * will be disabled and only popover content will be visible to screen readers.
   * Optional, defaults to false.
   */
  modalPopover?: boolean;

  /**
   * Additional class names to apply custom styles to the multi-select component.
   * Optional, can be used to add custom styles.
   */
  className?: string;

  /**
   * Callback function triggered when the search input value changes.
   * Optional, receives the search string.
   */
  onSearchChange?: (search: string) => void;

  /**
   * Whether the component is in a loading state (e.g., during search).
   * Optional, defaults to false.
   */
  loading?: boolean;

  /**
   * Text to display when loading.
   * Optional, defaults to "Searching...".
   */
  loadingText?: string;

  /**
   * Text to display when no results are found.
   * Optional, defaults to "No results found.".
   */
  emptyText?: string;

  /**
   * Whether to hide the "Select All" option.
   * Optional, defaults to false.
   */
  hideSelectAll?: boolean;

  /**
   * Custom function to determine if an option should appear selected.
   * Useful when option values differ from selected values (e.g., prefixed values).
   * If not provided, uses default check: selectedValues.includes(option.value)
   */
  isOptionSelected?: (optionValue: string, selectedValues: string[]) => boolean;
}

export const MultiSelect = React.forwardRef<HTMLButtonElement, MultiSelectProps>(
  (
    {
      options,
      onValueChange,
      variant,
      defaultValue = [],
      value,
      placeholder = "Select options",
      animation = 0,
      maxCount = 3,
      modalPopover = false,
      className,
      onSearchChange,
      loading = false,
      loadingText = "Searching...",
      emptyText = "No results found.",
      hideSelectAll = false,
      isOptionSelected,
      ...props
    },
    _ref,
  ) => {
    // Using internal state only if value prop is not provided (uncontrolled mode)
    const [internalSelectedValues, setInternalSelectedValues] = React.useState<string[]>(defaultValue);

    // If value prop is provided, use it (controlled mode), otherwise use internal state
    const selectedValues = value !== undefined ? value : internalSelectedValues;

    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
    const [isAnimating, setIsAnimating] = React.useState(false);

    // Ref and state to match popover width to trigger width
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const [triggerWidth, setTriggerWidth] = React.useState<number>(0);

    // Measure trigger width when popover opens
    React.useEffect(() => {
      if (isPopoverOpen && triggerRef.current) {
        setTriggerWidth(triggerRef.current.offsetWidth);
      }
    }, [isPopoverOpen]);

    const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        setIsPopoverOpen(true);
      } else if (event.key === "Backspace" && !event.currentTarget.value) {
        const newSelectedValues = [...selectedValues];
        newSelectedValues.pop();

        // If in uncontrolled mode, update internal state
        if (value === undefined) {
          setInternalSelectedValues(newSelectedValues);
        }

        // Always call the callback
        onValueChange(newSelectedValues);
      }
    };

    const toggleOption = (option: string) => {
      const newSelectedValues = selectedValues.includes(option)
        ? selectedValues.filter((value) => value !== option)
        : [...selectedValues, option];

      // If in uncontrolled mode, update internal state
      if (value === undefined) {
        setInternalSelectedValues(newSelectedValues);
      }

      // Always call the callback
      onValueChange(newSelectedValues);
    };

    const handleClear = () => {
      // If in uncontrolled mode, update internal state
      if (value === undefined) {
        setInternalSelectedValues([]);
      }

      // Always call the callback
      onValueChange([]);
    };

    const handleTogglePopover = (event: React.MouseEvent) => {
      // Don't toggle if clicking on X buttons (clear icons)
      const target = event.target as HTMLElement;
      if (target.closest("[data-remove-button]")) {
        return;
      }
      setIsPopoverOpen((prev) => !prev);
    };

    const clearExtraOptions = () => {
      const newSelectedValues = selectedValues.slice(0, maxCount);

      // If in uncontrolled mode, update internal state
      if (value === undefined) {
        setInternalSelectedValues(newSelectedValues);
      }

      // Always call the callback
      onValueChange(newSelectedValues);
    };

    const toggleAll = () => {
      let newSelectedValues: string[];

      if (selectedValues.length === options.length) {
        newSelectedValues = [];
      } else {
        newSelectedValues = options.map((option) => option.value);
      }

      // If in uncontrolled mode, update internal state
      if (value === undefined) {
        setInternalSelectedValues(newSelectedValues);
      }

      // Always call the callback
      onValueChange(newSelectedValues);
    };

    return (
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen} modal={modalPopover}>
        <PopoverTrigger
          {...props}
          ref={triggerRef}
          onClick={handleTogglePopover}
          className={cn(
            "flex h-auto min-h-10 w-full items-center justify-between rounded-md border bg-inherit p-1 hover:bg-inherit [&_svg]:pointer-events-auto",
            className,
          )}
        >
          {selectedValues.length > 0 ? (
            <div className="flex w-full items-center justify-between">
              <div className="flex flex-wrap items-center">
                {selectedValues.slice(0, maxCount).map((value) => {
                  const option = options.find((o) => o.value === value);
                  const IconComponent = option?.icon;
                  return (
                    <Badge
                      key={value}
                      className={cn(isAnimating ? "animate-bounce" : "", multiSelectVariants({ variant }))}
                      style={{ animationDuration: `${animation}s` }}
                    >
                      {IconComponent && <IconComponent className="mr-2 h-4 w-4" />}
                      {option?.selectedLabel ?? option?.label}
                      <XCircle
                        data-remove-button
                        className="ml-2 h-4 w-4 cursor-pointer"
                        onPointerDown={(event) => {
                          event.stopPropagation();
                          event.preventDefault();
                        }}
                        onClick={(event) => {
                          event.stopPropagation();
                          event.preventDefault();
                          toggleOption(value);
                        }}
                      />
                    </Badge>
                  );
                })}
                {selectedValues.length > maxCount && (
                  <Badge
                    className={cn(
                      "text-foreground border-foreground/1 bg-transparent hover:bg-transparent",
                      isAnimating ? "animate-bounce" : "",
                      multiSelectVariants({ variant }),
                    )}
                    style={{ animationDuration: `${animation}s` }}
                  >
                    {`+ ${selectedValues.length - maxCount} more`}
                    <XCircle
                      data-remove-button
                      className="ml-2 h-4 w-4 cursor-pointer"
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        event.preventDefault();
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        event.preventDefault();
                        clearExtraOptions();
                      }}
                    />
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <XIcon
                  data-remove-button
                  className="text-muted-foreground mx-2 h-4 cursor-pointer"
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    event.preventDefault();
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    handleClear();
                  }}
                />
                <Separator orientation="vertical" className="flex h-full min-h-6" />
                <ChevronDown className="text-muted-foreground mx-2 h-4 cursor-pointer" />
              </div>
            </div>
          ) : (
            <div className="mx-auto flex w-full items-center justify-between">
              <span className="text-muted-foreground mx-3 text-sm">{placeholder}</span>
              <ChevronDown className="text-muted-foreground mx-2 h-4 cursor-pointer" />
            </div>
          )}
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0"
          style={{ minWidth: triggerWidth > 0 ? triggerWidth : undefined }}
          align="start"
        >
          <Command>
            <CommandInput
              autoFocus
              placeholder="Search..."
              onKeyDown={handleInputKeyDown}
              onValueChange={onSearchChange}
            />
            {loading && (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
              </div>
            )}
            <CommandList>
              <CommandEmpty>{loading ? loadingText : emptyText}</CommandEmpty>
              <CommandGroup>
                {!hideSelectAll && (
                  <CommandItem
                    key="all"
                    onSelect={toggleAll}
                    className="cursor-pointer hover:bg-muted data-selected:hover:bg-muted bg-transparent data-selected:bg-transparent"
                  >
                    <div
                      className={cn(
                        "border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                        selectedValues.length === options.length
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible",
                      )}
                    >
                      <CheckIcon className="h-4 w-4" />
                    </div>
                    <span>(Select All)</span>
                  </CommandItem>
                )}
                {options.map((option) => {
                  const isSelected = isOptionSelected
                    ? isOptionSelected(option.value, selectedValues)
                    : selectedValues.includes(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      onSelect={() => toggleOption(option.value)}
                      className="cursor-pointer hover:bg-muted data-selected:hover:bg-muted bg-transparent data-selected:bg-transparent"
                    >
                      <div
                        className={cn(
                          "border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                          isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible",
                        )}
                      >
                        <CheckIcon className="h-4 w-4" />
                      </div>
                      {option.icon && (
                        <option.icon className={option.iconClassName ?? "text-muted-foreground mr-2 h-4 w-4"} />
                      )}
                      <span>{option.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <div className="flex items-center justify-between">
                  {selectedValues.length > 0 && (
                    <>
                      <CommandItem onSelect={handleClear} className="flex-1 cursor-pointer justify-center">
                        Clear
                      </CommandItem>
                      <Separator orientation="vertical" className="flex h-full min-h-6" />
                    </>
                  )}
                  <CommandItem
                    onSelect={() => setIsPopoverOpen(false)}
                    className="max-w-full flex-1 cursor-pointer justify-center hover:bg-muted data-selected:hover:bg-muted bg-transparent data-selected:bg-transparent"
                  >
                    Close
                  </CommandItem>
                </div>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
        {animation > 0 && selectedValues.length > 0 && (
          <WandSparkles
            className={cn(
              "text-foreground bg-background my-2 h-3 w-3 cursor-pointer",
              isAnimating ? "" : "text-muted-foreground",
            )}
            onClick={() => setIsAnimating(!isAnimating)}
          />
        )}
      </Popover>
    );
  },
);

MultiSelect.displayName = "MultiSelect";
