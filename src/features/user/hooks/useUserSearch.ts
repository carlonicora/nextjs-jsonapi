"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDebounce } from "../../../hooks/useDebounce";
import { UserInterface, UserService } from "../data";

export const useUserSearch = () => {
  const [users, setUsers] = useState<UserInterface[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const searchQueryRef = useRef("");

  const loadUsers = useCallback(
    async (search: string) => {
      try {
        if (search === searchQueryRef.current && users.length > 0) return;
        setIsLoading(true);
        searchQueryRef.current = search;
        const fetchedUsers = await UserService.findMany({ search, fetchAll: true });
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Failed to load users:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [users.length],
  );

  const debouncedLoadUsers = useDebounce(loadUsers, 500);

  useEffect(() => {
    if (searchQuery !== searchQueryRef.current) {
      setIsLoading(true);
      debouncedLoadUsers(searchQuery);
    }
  }, [searchQuery, debouncedLoadUsers]);

  const clearSearch = () => {
    setSearchQuery("");
    searchQueryRef.current = "";
  };

  return {
    users,
    searchQuery,
    setSearchQuery,
    isLoading,
    loadUsers,
    clearSearch,
    searchQueryRef,
  };
};
