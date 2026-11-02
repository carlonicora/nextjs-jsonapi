"use client";

import { UserPlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { v4 } from "uuid";
import { errorToast } from "../../../../components";
import { Modules } from "../../../../core";
import { DataListRetriever, useDataListRetriever, useDebounce } from "../../../../hooks";
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../../shadcnui";
import { getInitials } from "../../../../utils/getInitials";
import { showToast } from "../../../../utils/toast";
import { EmailAutomationCandidateInterface } from "../../data/EmailAutomationCandidateInterface";
import { EmailAutomationService } from "../../data/EmailAutomationService";

export type EmailAutomationAddPersonDialogProps = {
  automationId: string;
  disabled: boolean;
  onAdded: () => void;
};

/**
 * "Add person" on the Recipients tab: searches users and waitlist entries and
 * enrols the picked one. The API decides who is addable and why not; this
 * dialog only shows it (addable rows first, then dimmed rows with the reason).
 */
export function EmailAutomationAddPersonDialog({
  automationId,
  disabled,
  onAdded,
}: EmailAutomationAddPersonDialogProps) {
  const t = useTranslations();
  const [open, setOpen] = useState<boolean>(false);
  const searchTermRef = useRef<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const data: DataListRetriever<EmailAutomationCandidateInterface> = useDataListRetriever({
    ready: open,
    retriever: (params) => EmailAutomationService.findCandidates(params),
    retrieverParams: { automationId },
    module: Modules.EmailAutomationCandidate,
  });

  useEffect(() => {
    if (open) data.setReady(true);
  }, [data, open]);

  const refreshList = useCallback(
    async (searchedTerm: string) => {
      if (searchedTerm === searchTermRef.current) return;
      searchTermRef.current = searchedTerm;
      await data.search(searchedTerm);
    },
    [data],
  );

  const updateSearchTerm = useDebounce(refreshList, 500);

  useEffect(() => {
    if (open) updateSearchTerm(searchTerm);
  }, [open, searchTerm]);

  useEffect(() => () => updateSearchTerm.cancel(), [updateSearchTerm]);

  useEffect(() => {
    if (!data.next || !sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) data.next?.();
      },
      { threshold: 0.1, rootMargin: "200px" },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [data.next]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      updateSearchTerm.cancel();
      return;
    }

    // Reopening starts from an empty search and re-reads the list: someone added
    // last time is now "already in this automation".
    setSearchTerm("");
    if (data.isLoaded) {
      if (searchTermRef.current !== "") {
        searchTermRef.current = "";
        void data.search("");
      } else {
        void data.refresh();
      }
    }
  };

  const add = async (candidate: EmailAutomationCandidateInterface) => {
    if (!candidate.addable) return;
    try {
      await EmailAutomationService.addEnrollment({
        automationId,
        input: { id: v4(), recipientType: candidate.recipientType, recipientId: candidate.recipientId },
      });
      setOpen(false);
      showToast(t("emailAutomations.recipients.addDialog.added", { email: candidate.email }));
      onAdded();
    } catch (error) {
      errorToast({ title: t("common.errors.error"), error });
    }
  };

  const candidates = data.data ?? [];
  const addable = candidates.filter((candidate) => candidate.addable);
  const blocked = candidates.filter((candidate) => !candidate.addable);

  const renderCandidate = (candidate: EmailAutomationCandidateInterface) => (
    <CommandItem
      key={candidate.id}
      className="cursor-pointer hover:bg-muted data-selected:hover:bg-muted bg-transparent data-selected:bg-transparent"
      value={candidate.id}
      disabled={!candidate.addable}
      data-testid={`email-automation-candidate-${candidate.recipientId}`}
      data-addable={candidate.addable ? "true" : "false"}
      onSelect={() => void add(candidate)}
    >
      <div className="flex min-w-0 flex-1 flex-row items-center px-4 py-1">
        <div className="*:ring-border *:ring-1">
          <Avatar className="h-6 w-6">
            <AvatarFallback>{getInitials(candidate.name || candidate.email)}</AvatarFallback>
          </Avatar>
        </div>
        <div className="ms-5 me-3 flex min-w-0 flex-1 flex-col">
          {candidate.name ? (
            <>
              <div className="truncate text-sm font-medium">{candidate.name}</div>
              <div className="truncate text-xs font-normal">{candidate.email}</div>
            </>
          ) : (
            <div className="truncate text-sm font-medium">{candidate.email}</div>
          )}
        </div>
        {candidate.addable ? (
          <Badge
            variant={candidate.recipientType === "waitlist" ? "softBlue" : "softGray"}
            className="ms-auto shrink-0"
          >
            {t(`emailAutomations.recipients.addDialog.kind.${candidate.recipientType}`)}
          </Badge>
        ) : (
          candidate.reason && (
            <Badge
              variant="softAmber"
              className="ms-auto shrink-0"
              data-testid={`email-automation-candidate-reason-${candidate.recipientId}`}
            >
              {t(`emailAutomations.recipients.addDialog.reason.${candidate.reason}`)}
            </Badge>
          )
        )}
      </div>
    </CommandItem>
  );

  return (
    <div className="flex items-center gap-2">
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger
          render={<Button variant="outline" size="sm" data-testid="email-automation-add-person" />}
          disabled={disabled}
        >
          <UserPlusIcon className="h-3.5 w-3.5" />
          {t("emailAutomations.recipients.addPerson")}
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl" data-testid="email-automation-add-person-dialog">
          <DialogHeader>
            <DialogTitle>{t("emailAutomations.recipients.addDialog.title")}</DialogTitle>
          </DialogHeader>
          <Command shouldFilter={false}>
            <CommandInput
              data-testid="email-automation-add-person-search"
              placeholder={t("emailAutomations.recipients.addDialog.search")}
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList className="mt-2">
              <CommandEmpty>{t("emailAutomations.recipients.addDialog.empty")}</CommandEmpty>
              {addable.length > 0 && (
                <CommandGroup heading={t("emailAutomations.recipients.addDialog.groups.addable")}>
                  {addable.map(renderCandidate)}
                </CommandGroup>
              )}
              {blocked.length > 0 && (
                <CommandGroup heading={t("emailAutomations.recipients.addDialog.groups.blocked")}>
                  {blocked.map(renderCandidate)}
                </CommandGroup>
              )}
              {data.next && <div ref={sentinelRef} style={{ height: 1 }} />}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
      {disabled && (
        <span className="text-muted-foreground text-xs font-normal">
          {t("emailAutomations.recipients.addPersonNoSteps")}
        </span>
      )}
    </div>
  );
}
