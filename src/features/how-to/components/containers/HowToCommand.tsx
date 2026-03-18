"use client";

import { ArrowRight, LifeBuoyIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  SidebarMenuButton,
} from "../../../../shadcnui";
import { Modules } from "../../../../core";
import { DataListRetriever, useDataListRetriever, useDebounce } from "../../../../hooks";
import { HowTo } from "../../data/HowTo";
import { HowToInterface } from "../../data/HowToInterface";
import { HowToService } from "../../data/HowToService";
import HowToCommandViewer from "./HowToCommandViewer";

type HowToCommandProps = {
  /** Current pathname for page relevance matching */
  pathname: string;
  /** Optional extra command groups to render when not searching */
  extraGroups?: ReactNode;
  /** Called when user starts a chat from the viewer */
  onStartChat?: () => void;
};

export default function HowToCommand({ pathname, extraGroups, onStartChat }: HowToCommandProps) {
  const t = useTranslations();

  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [selectedHowTo, setSelectedHowTo] = useState<HowToInterface | null>(null);

  const searchTermRef = useRef<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const data: DataListRetriever<HowToInterface> = useDataListRetriever({
    retriever: (params) => {
      return HowToService.findMany(params);
    },
    retrieverParams: {},
    module: Modules.HowTo,
  });

  // Split HowTos into relevant (matching current page) and others
  const { relevantHowTos, otherHowTos } = useMemo(() => {
    if (!data.data) return { relevantHowTos: [], otherHowTos: [] };

    const relevant: HowToInterface[] = [];
    const other: HowToInterface[] = [];

    (data.data as HowToInterface[]).forEach((howTo) => {
      const pages = HowTo.parsePagesFromString(howTo.pages);
      const isRelevant = pages.some((page) => page && pathname.toLowerCase().includes(page.toLowerCase()));
      if (isRelevant) {
        relevant.push(howTo);
      } else {
        other.push(howTo);
      }
    });

    return { relevantHowTos: relevant, otherHowTos: other };
  }, [data.data, pathname]);

  const search = useCallback(
    async (searchedTerm: string) => {
      if (searchedTerm === searchTermRef.current) return;
      searchTermRef.current = searchedTerm;
      await data.search(searchedTerm);
    },
    [searchTermRef, data],
  );

  const updateSearchTerm = useDebounce(search, 500);

  useEffect(() => {
    updateSearchTerm(searchTerm);
  }, [updateSearchTerm, searchTerm]);

  // Reset search when dialog closes
  useEffect(() => {
    if (!dialogOpen) {
      setSearchTerm("");
      searchTermRef.current = "";
    }
  }, [dialogOpen]);

  // Keyboard shortcut: Cmd+K or Ctrl+K to toggle dialog
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setDialogOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleStartChat = () => {
    setDialogOpen(false);
    setSelectedHowTo(null);
    if (onStartChat) onStartChat();
  };

  return (
    <>
      <SidebarMenuButton
        tooltip={t(`howto.command.trigger`)}
        onClick={() => setDialogOpen(true)}
        className="text-muted-foreground"
      >
        <LifeBuoyIcon />
        <span>{t(`howto.command.trigger`)}</span>
      </SidebarMenuButton>

      {/* Search HowTos Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedHowTo(null);
        }}
        modal={true}
      >
        <DialogContent
          className={`flex flex-col gap-0 overflow-hidden p-0 ${selectedHowTo ? "h-[80vh] max-w-3xl" : "max-w-lg"}`}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{selectedHowTo ? selectedHowTo.name : t("howto.command.title")}</DialogTitle>
            <DialogDescription> </DialogDescription>
          </DialogHeader>

          {selectedHowTo ? (
            <HowToCommandViewer
              howTo={selectedHowTo}
              onBack={() => setSelectedHowTo(null)}
              onStartChat={handleStartChat}
            />
          ) : (
            <Command
              shouldFilter={false}
              className="[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
            >
              <CommandInput
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setSearchTerm("");
                    searchTermRef.current = "";
                  }
                }}
                onValueChange={setSearchTerm}
                value={searchTerm}
                placeholder={t(`howto.search.placeholder`)}
              />
              <CommandList className="max-h-[60vh] overflow-y-auto">
                <CommandEmpty>{t(`howto.command.empty`)}</CommandEmpty>

                {/* App-specific extra groups (support, tours, etc.) */}
                {!searchTerm && extraGroups}

                {/* Relevant to this page */}
                {relevantHowTos.length > 0 && (
                  <CommandGroup heading={t(`howto.command.relevant`)}>
                    {relevantHowTos.map((howTo: HowToInterface) => (
                      <CommandItem key={howTo.id} onSelect={() => setSelectedHowTo(howTo)} className="cursor-pointer">
                        <ArrowRight className="h-4 w-4" />
                        <span>{howTo.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* All HowTos / Search Results */}
                {otherHowTos.length > 0 && (
                  <CommandGroup heading={searchTerm ? undefined : t(`howto.command.all`)}>
                    {otherHowTos.map((howTo: HowToInterface) => (
                      <CommandItem key={howTo.id} onSelect={() => setSelectedHowTo(howTo)} className="cursor-pointer">
                        <ArrowRight className="h-4 w-4" />
                        <span>{howTo.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>

              {/* Keyboard hints footer */}
              <div className="text-muted-foreground flex items-center justify-center gap-4 border-t px-3 py-2 text-xs">
                <span className="flex items-center gap-1">
                  <kbd className="bg-muted rounded border px-1.5 py-0.5 font-mono text-[10px]">&#9166;</kbd>
                  {t(`howto.command.keyboard.select`)}
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="bg-muted rounded border px-1.5 py-0.5 font-mono text-[10px]">&#8593;&#8595;</kbd>
                  {t(`howto.command.keyboard.navigate`)}
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="bg-muted rounded border px-1.5 py-0.5 font-mono text-[10px]">
                    {t(`howto.keyboard.esc`)}
                  </kbd>
                  {t(`howto.command.keyboard.close`)}
                </span>
              </div>
            </Command>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
