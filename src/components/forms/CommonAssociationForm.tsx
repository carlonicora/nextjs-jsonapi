"use client";

import { useTranslations } from "next-intl";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { showToast } from "../../utils/toast";
import { DataListRetriever, useDebounce } from "../../hooks";
import {
  Button,
  Command,
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandList,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../shadcnui";

type CommonAssociationTriggerProps = {
  sourceType: string;
  destinationType: string;
  hasDestination?: boolean;
  onTrigger: () => void;
};

export function CommonAssociationTrigger({
  sourceType,
  destinationType,
  hasDestination,
  onTrigger,
}: CommonAssociationTriggerProps) {
  const t = useTranslations();

  if (hasDestination)
    return (
      <div className="hover:text-accent cursor-pointer" onClick={onTrigger}>
        Join
      </div>
    );

  return (
    <Button variant={`outline`} size={`sm`} onClick={onTrigger}>
      {t(`common.association.label`, {
        source: sourceType,
        destination: destinationType,
      })}
    </Button>
  );
}

type CommonAssociationCommandDialogProps = {
  show: boolean;
  setShow: (show: boolean) => void;
  data: DataListRetriever<any>;
  source: string;
  destination: string;
  destinationName: string;
  children: ReactNode;
};

export function CommonAssociationCommandDialog({
  show,
  setShow,
  data,
  source,
  destination,
  destinationName,
  children,
}: CommonAssociationCommandDialogProps) {
  const t = useTranslations();

  const searchTermRef = useRef<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const refreshList = useCallback(
    async (searchedTerm: string) => {
      if (searchedTerm === searchTermRef.current) return;
      searchTermRef.current = searchedTerm;
      await data.search(searchedTerm);
    },
    [searchTerm, data],
  );

  const updateSearchTerm = useDebounce(refreshList, 500);

  useEffect(() => {
    if (show) updateSearchTerm(searchTerm);
  }, [show, searchTerm]);

  return (
    <CommandDialog open={show} onOpenChange={setShow}>
      <DialogHeader className="flex flex-col items-start p-4 pb-0">
        <DialogTitle>
          {t(`common.association.label`, {
            source: source,
            destination: destination,
          })}
        </DialogTitle>
        <DialogDescription>
          {t(`common.association.description`, {
            source: source,
            destination: destination,
            destination_name: destinationName,
          })}
        </DialogDescription>
      </DialogHeader>
      <Command shouldFilter={false} className="p-4">
        <CommandInput
          placeholder={t(`ui.search.placeholder`, { type: source })}
          value={searchTerm}
          onValueChange={setSearchTerm}
        />
        <CommandList className="mt-3 h-auto max-h-96 min-h-96 max-w-full overflow-y-auto overflow-x-hidden">
          <CommandEmpty>{t(`ui.search.no_results`, { type: source })}</CommandEmpty>
          {children}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

export const triggerAssociationToast = (params: {
  t: any;
  source: string;
  destination: string;
  source_name: string;
  destination_name: string;
  level?: string;
}) => {
  if (params.level) {
    showToast(
      params.t(`common.association.label`, {
        source: params.source,
        destination: params.destination,
      }),
      {
        description: params.t(`common.association.success_level`, {
          source: params.source,
          destination: params.destination,
          source_name: params.source_name,
          destination_name: params.destination_name,
          level: params.level,
        }),
      },
    );
  } else {
    showToast(
      params.t(`common.association.label`, {
        source: params.source,
        destination: params.destination,
      }),
      {
        description: params.t(`common.association.success`, {
          source: params.source,
          destination: params.destination,
          source_name: params.source_name,
          destination_name: params.destination_name,
        }),
      },
    );
  }
};
