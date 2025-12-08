"use client";

import { useEffect, useRef, useState } from "react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, Input } from "../../shadcnui";
import { cn } from "../../utils";

/**
 * FormPlaceAutocomplete component integrates Google Places API (New)
 * to provide address suggestions as the user types.
 *
 * Prerequisites:
 * 1. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable
 * 2. Enable Places API (New) in Google Cloud Console
 * 3. Configure API key restrictions as needed
 *
 * Note: This uses the new Places API via REST calls, not the legacy JavaScript API
 */

interface PlaceSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface PlaceAutocompleteProps {
  form: any;
  id: string;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  testId?: string;
  isRequired?: boolean;
  onPlaceSelect?: (place: PlaceSuggestion) => void;
  className?: string;
  /**
   * Optional array of place types to include in search results.
   * When not specified, defaults to address types: ["street_address", "premise", "subpremise"]
   * For cities, use: ["locality", "administrative_area_level_3"]
   * For regions, use: ["administrative_area_level_1", "administrative_area_level_2"]
   */
  includeTypes?: string[];
}

export function FormPlaceAutocomplete({
  form,
  id,
  name,
  placeholder,
  disabled,
  testId,
  isRequired = false,
  onPlaceSelect,
  className,
  includeTypes,
}: PlaceAutocompleteProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize API key
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!key) {
      console.error("Google Maps API key not found. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable.");
      setLoadError(true);
      return;
    }

    setApiKey(key);
  }, []);

  // Update input value when form value changes
  useEffect(() => {
    const formValue = form.getValues(id);
    if (formValue !== inputValue) {
      setInputValue(formValue || "");
    }
  }, [form.watch(id), id, inputValue]);

  // Fetch place suggestions from Google Places API (New)
  const fetchSuggestions = async (input: string) => {
    if (!apiKey) return;

    try {
      setIsLoading(true);

      // Using the new Places API autocomplete endpoint
      const response = await fetch(`https://places.googleapis.com/v1/places:autocomplete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
        },
        body: JSON.stringify({
          input: input,
          includedPrimaryTypes: includeTypes || ["street_address", "premise", "subpremise"],
          languageCode: "en",
        }),
      });

      if (!response.ok) {
        throw new Error(`Places API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.suggestions) {
        const formattedSuggestions: PlaceSuggestion[] = data.suggestions.map((suggestion: any) => ({
          place_id: suggestion.placePrediction?.placeId || "",
          description: suggestion.placePrediction?.text?.text || "",
          structured_formatting: {
            main_text: suggestion.placePrediction?.structuredFormat?.mainText?.text || "",
            secondary_text: suggestion.placePrediction?.structuredFormat?.secondaryText?.text || "",
          },
        }));

        setSuggestions(formattedSuggestions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error("Error fetching place suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes with debouncing
  const handleInputChange = (value: string) => {
    setInputValue(value);
    form.setValue(id, value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.length > 2 && apiKey) {
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(value);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: PlaceSuggestion) => {
    setInputValue(suggestion.description);
    form.setValue(id, suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);

    if (onPlaceSelect) {
      onPlaceSelect(suggestion);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Fallback to regular input if API key is not available
  if (loadError) {
    return (
      <div className="flex w-full flex-col">
        <FormField
          control={form.control}
          name={id}
          render={({ field }) => (
            <FormItem className={`${name ? "mb-5" : "mb-1"}`}>
              {name && (
                <FormLabel className="flex items-center">
                  {name}
                  {isRequired && <span className="text-destructive ml-2 font-semibold">*</span>}
                </FormLabel>
              )}
              <FormControl>
                <Input
                  {...field}
                  placeholder={placeholder}
                  disabled={disabled}
                  data-testid={testId}
                  className={cn("w-full", className)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col" ref={containerRef}>
      <FormField
        control={form.control}
        name={id}
        render={({ field }) => (
          <FormItem className={`${name ? "mb-5" : "mb-1"}`}>
            {name && (
              <FormLabel className="flex items-center">
                {name}
                {isRequired && <span className="text-destructive ml-2 font-semibold">*</span>}
              </FormLabel>
            )}
            <FormControl>
              <div className="relative">
                <Input
                  value={inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onBlur={field.onBlur}
                  onFocus={() => {
                    if (suggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  placeholder={placeholder}
                  disabled={disabled || !apiKey}
                  data-testid={testId}
                  className={cn("w-full", className)}
                />

                {/* Loading indicator */}
                {isLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
                  </div>
                )}

                {/* Suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="bg-background absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-md border shadow-lg">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={suggestion.place_id || index}
                        className="hover:bg-muted cursor-pointer px-3 py-2 text-sm"
                        onClick={() => handleSuggestionSelect(suggestion)}
                      >
                        <div className="font-medium">{suggestion.structured_formatting?.main_text}</div>
                        <div className="text-muted-foreground">{suggestion.structured_formatting?.secondary_text}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
