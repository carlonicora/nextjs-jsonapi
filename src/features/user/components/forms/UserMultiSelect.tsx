"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWatch } from "react-hook-form";
import { FormFieldWrapper } from "../../../../components/forms";
import { Modules } from "../../../../core";
import { DataListRetriever, useDataListRetriever, useDebounce } from "../../../../hooks";
import { Avatar, AvatarFallback, AvatarImage, MultipleSelector } from "../../../../shadcnui";
import { Option } from "../../../../shadcnui";
import { useCurrentUserContext } from "../../contexts";
import { UserInterface } from "../../data";
import { UserService } from "../../data/user.service";

// Type for user objects in the form
type UserSelectType = {
  id: string;
  name: string;
  avatar?: string;
};

type UserMultiSelectProps = {
  id: string;
  form: any;
  currentUser?: UserInterface;
  label?: string;
  placeholder?: string;
  onChange?: (users?: UserInterface[]) => void;
  maxCount?: number;
  isRequired?: boolean;
};

type UserOption = Option & {
  userData?: UserInterface;
  avatar?: string;
};

function UserAvatarIcon({ className, url, name }: { className?: string; url?: string; name?: string }) {
  return (
    <Avatar className={`${className || "h-4 w-4"}`}>
      <AvatarImage src={url} />
      <AvatarFallback>
        {name
          ? name
              .split(" ")
              .map((n: string) => n.charAt(0).toUpperCase())
              .join("")
          : "U"}
      </AvatarFallback>
    </Avatar>
  );
}

export function UserMultiSelect({
  id,
  form,
  currentUser,
  label,
  placeholder,
  onChange,
  maxCount = 3,
  isRequired = false,
}: UserMultiSelectProps) {
  const t = useTranslations();
  const { company } = useCurrentUserContext<UserInterface>();

  const searchTermRef = useRef<string>("");
  const [searchTerm, _setSearchTerm] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);

  // Get the current selected users from the form
  const selectedUsers: UserSelectType[] = useWatch({ control: form.control, name: id }) || [];

  const data: DataListRetriever<UserInterface> = useDataListRetriever({
    ready: !!company,
    retriever: (params) => {
      return UserService.findAllUsers(params);
    },
    retrieverParams: { companyId: company?.id },
    module: Modules.User,
  }) as DataListRetriever<UserInterface>;

  useEffect(() => {
    if (company) data.setReady(true);
  }, [company]);

  const search = useCallback(
    async (searchedTerm: string) => {
      try {
        if (searchedTerm === searchTermRef.current) return;
        setIsSearching(true);
        searchTermRef.current = searchedTerm;
        await data.search(searchedTerm);
      } finally {
        setIsSearching(false);
      }
    },
    [searchTermRef, data],
  );

  const updateSearchTerm = useDebounce(search, 500);

  useEffect(() => {
    setIsSearching(true);
    updateSearchTerm(searchTerm);
  }, [updateSearchTerm, searchTerm]);

  // Update userOptions when data changes or when initial selected users are available
  useEffect(() => {
    if (data.data && data.data.length > 0) {
      const users = data.data as UserInterface[];
      const filteredUsers = users.filter((user) => user.id !== currentUser?.id);

      const options: UserOption[] = filteredUsers.map((user) => ({
        label: user.name,
        value: user.id,
        userData: user,
        avatar: user.avatar,
      }));

      // Add options for any already selected users that aren't in search results
      const existingOptionIds = new Set(options.map((option) => option.value));
      const missingOptions: UserOption[] = selectedUsers
        .filter((user) => !existingOptionIds.has(user.id))
        .map((user) => ({
          label: user.name,
          value: user.id,
          userData: user as unknown as UserInterface,
          avatar: user.avatar,
        }));

      setUserOptions([...options, ...missingOptions]);
    }
  }, [data.data, currentUser, selectedUsers]);

  // Convert selected users to Option[] format
  const selectedOptions = useMemo(() => {
    return selectedUsers.map((user) => ({
      value: user.id,
      label: user.name,
    }));
  }, [selectedUsers]);

  const handleChange = (options: Option[]) => {
    // Convert to form format
    const formValues = options.map((option) => {
      const userOption = userOptions.find((opt) => opt.value === option.value);
      return {
        id: option.value,
        name: option.label,
        avatar: userOption?.avatar,
      };
    });

    form.setValue(id, formValues, { shouldDirty: true, shouldTouch: true });

    if (onChange) {
      // Get full user data for onChange callback
      const fullUsers = options
        .map((option) => {
          const userOption = userOptions.find((opt) => opt.value === option.value);
          return userOption?.userData;
        })
        .filter(Boolean) as UserInterface[];
      onChange(fullUsers);
    }
  };

  // Custom render function for dropdown options (with avatar)
  const renderOption = (option: Option) => {
    const userOption = option as UserOption;
    return (
      <span className="flex items-center gap-2">
        <UserAvatarIcon url={userOption.avatar} name={option.label} />
        {option.label}
      </span>
    );
  };

  // Search handler
  const handleSearchSync = (search: string): Option[] => {
    _setSearchTerm(search);
    return userOptions;
  };

  return (
    <div className="flex w-full flex-col">
      <FormFieldWrapper form={form} name={id} label={label} isRequired={isRequired}>
        {() => (
          <MultipleSelector
            value={selectedOptions}
            onChange={handleChange}
            options={userOptions}
            placeholder={placeholder}
            maxDisplayCount={maxCount}
            hideClearAllButton
            onSearchSync={handleSearchSync}
            delay={0}
            renderOption={renderOption}
            loadingIndicator={
              isSearching ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">{t("ui.search.button")}</span>
                </div>
              ) : undefined
            }
            emptyIndicator={
              <span className="text-muted-foreground">
                {t("ui.search.no_results", { type: t("entities.users", { count: 2 }) })}
              </span>
            }
          />
        )}
      </FormFieldWrapper>
    </div>
  );
}
