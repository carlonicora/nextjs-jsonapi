"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { useWatch } from "react-hook-form";
import { FormFieldWrapper } from "../../../../components/forms";
import { Modules } from "../../../../core";
import { DataListRetriever, useDataListRetriever, useDebounce } from "../../../../hooks";
import { Avatar, AvatarFallback, AvatarImage, MultiSelect } from "../../../../shadcnui";
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
  const [userOptions, setUserOptions] = useState<any[]>([]);

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

      const options = filteredUsers.map((user) => ({
        label: user.name,
        value: user.id,
        icon: ({ className }: { className?: string }) => (
          <UserAvatarIcon className={className} url={user.avatar} name={user.name} />
        ),
        userData: user,
      }));

      setUserOptions(options);
    }
  }, [data.data, currentUser]);

  // Add options for any already selected users that aren't in search results
  useEffect(() => {
    if (selectedUsers.length > 0) {
      // Create a map of existing option IDs for quick lookup
      const existingOptionIds = new Set(userOptions.map((option) => option.value));

      // Find selected users that don't have an option yet
      const missingOptions = selectedUsers
        .filter((user) => !existingOptionIds.has(user.id))
        .map((user) => ({
          label: user.name,
          value: user.id,
          icon: ({ className }: { className?: string }) => (
            <UserAvatarIcon className={className} url={user.avatar} name={user.name} />
          ),
          userData: user,
        }));

      // Add missing options if there are any
      if (missingOptions.length > 0) {
        setUserOptions((prev) => [...prev, ...missingOptions]);
      }
    }
  }, [selectedUsers, userOptions]);

  const handleValueChange = (selectedIds: string[]) => {
    // Map selected IDs to user objects for the form
    const updatedSelectedUsers = selectedIds.map((id) => {
      // First check if user is already in the selected users (preserve existing data)
      const existingUser = selectedUsers.find((user) => user.id === id);
      if (existingUser) {
        return existingUser;
      }

      // Otherwise, get user data from the options
      const option = userOptions.find((option) => option.value === id);
      if (option?.userData) {
        return {
          id: option.userData.id,
          name: option.userData.name,
          avatar: option.userData.avatar,
        };
      }

      // Fallback to just the ID if no data is available
      return { id, name: id };
    });

    form.setValue(id, updatedSelectedUsers);

    if (onChange) {
      const fullSelectedUsers = selectedIds
        .map((id) => userOptions.find((option) => option.value === id)?.userData)
        .filter(Boolean) as UserInterface[];
      onChange(fullSelectedUsers);
    }
  };

  // Extract just the IDs for the MultiSelect component
  const selectedUserIds = selectedUsers.map((user: UserSelectType) => user.id);

  return (
    <div className="flex w-full flex-col">
      <FormFieldWrapper form={form} name={id} label={label} isRequired={isRequired}>
        {() => (
          <MultiSelect
            options={userOptions}
            onValueChange={handleValueChange}
            defaultValue={selectedUserIds}
            placeholder={placeholder}
            maxCount={maxCount}
            animation={0}
            loading={isSearching}
            loadingText={t("ui.search.button")}
            emptyText={t("ui.search.no_results", { type: t("entities.users", { count: 2 }) })}
          />
        )}
      </FormFieldWrapper>
    </div>
  );
}
