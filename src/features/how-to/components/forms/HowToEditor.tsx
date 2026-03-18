"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, SearchIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ReactNode, useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { v4 } from "uuid";
import { z } from "zod";

import { EditorSheet, FormInput } from "../../../../components";
import { BlockNoteEditorContainer } from "../../../../components";
import { ModuleRegistry, Modules } from "../../../../core";
import { useI18nRouter } from "../../../../hooks";
import {
  Button,
  Command,
  CommandEmpty,
  CommandItem,
  CommandList,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../../shadcnui";
import { HowTo } from "../../data/HowTo";
import { HowToInput, HowToInterface } from "../../data/HowToInterface";
import { HowToService } from "../../data/HowToService";

function PageSelector({
  value,
  allPageUrls,
  selectedPages,
  placeholder,
  emptyMessage,
  onSelect,
  onRemove,
}: {
  value: string;
  allPageUrls: { id: string; text: string }[];
  selectedPages: string[];
  placeholder: string;
  emptyMessage: string;
  onSelect: (value: string) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedLabel = value ? allPageUrls.find((opt) => opt.id === value) : undefined;

  const filteredOptions = useMemo(() => {
    const available = allPageUrls.filter((opt) => opt.id === value || !selectedPages.includes(opt.id));
    if (!search) return available;
    const term = search.toLowerCase();
    return available.filter((opt) => opt.text.toLowerCase().includes(term) || opt.id.toLowerCase().includes(term));
  }, [allPageUrls, selectedPages, value, search]);

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen} modal={true}>
        <PopoverTrigger className="flex-1">
          <div className="bg-input/20 dark:bg-input/30 border-input flex h-9 w-full items-center rounded-md border px-3 text-sm">
            {selectedLabel ? (
              <span>
                {selectedLabel.text} ({selectedLabel.id})
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-(--anchor-width) p-0">
          <Command shouldFilter={false}>
            <div className="relative w-full border-b">
              <SearchIcon className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <Input
                placeholder={placeholder}
                type="text"
                className="rounded-none border-0 pl-8 focus-visible:ring-0"
                onChange={(e) => setSearch(e.target.value)}
                value={search}
              />
            </div>
            <CommandList className="max-h-48">
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              {filteredOptions.map((opt) => (
                <CommandItem
                  key={opt.id}
                  className="cursor-pointer"
                  onSelect={() => {
                    onSelect(opt.id);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  {opt.text} ({opt.id})
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Button type="button" variant="outline" size="icon" onClick={onRemove}>
        <XIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}

type HowToEditorProps = {
  howTo?: HowToInterface;
  propagateChanges?: (howTo: HowToInterface) => void;
  trigger?: ReactNode;
  forceShow?: boolean;
  onClose?: () => void;
  onRevalidate?: (path: string) => Promise<void>;
  dialogOpen?: boolean;
  onDialogOpenChange?: (open: boolean) => void;
};

function HowToEditorInternal({
  howTo,
  propagateChanges,
  trigger,
  forceShow,
  onClose,
  onRevalidate,
  dialogOpen,
  onDialogOpenChange,
}: HowToEditorProps) {
  const router = useI18nRouter();
  const t = useTranslations();

  const formSchema = useMemo(
    () =>
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1, { message: t(`howto.fields.name.error`) }),
        description: z.any(),
        pages: z.array(z.string()),
      }),
    [t],
  );

  const getDefaultValues = useCallback(
    () => ({
      id: howTo?.id || v4(),
      name: howTo?.name || "",
      description: howTo?.description || [],
      pages: HowTo.parsePagesFromString(howTo?.pages),
    }),
    [howTo],
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  });

  const handleDescriptionChange = useCallback(
    (content: any) => {
      form.setValue("description", content, { shouldDirty: true });
    },
    [form],
  );

  const allPageUrls = useMemo(() => ModuleRegistry.getAllPageUrls(), []);
  const pages = form.watch("pages");

  const addPage = () => {
    form.setValue("pages", [...pages, ""], { shouldDirty: true });
  };

  const removePage = (index: number) => {
    form.setValue(
      "pages",
      pages.filter((_: string, i: number) => i !== index),
      { shouldDirty: true },
    );
  };

  return (
    <EditorSheet
      form={form}
      entityType={t(`entities.howtos`, { count: 1 })}
      entityName={howTo?.name}
      isEdit={!!howTo}
      module={Modules.HowTo}
      propagateChanges={propagateChanges}
      size="lg"
      onSubmit={async (values) => {
        const payload: HowToInput = {
          id: values.id,
          name: values.name,
          authorId: "",
          description: values.description,
          pages: HowTo.serializePagesToString(values.pages),
        };

        const updatedHowTo = howTo ? await HowToService.update(payload) : await HowToService.create(payload);

        return updatedHowTo;
      }}
      onReset={() => {
        return getDefaultValues();
      }}
      onRevalidate={onRevalidate}
      onNavigate={(url) => router.push(url)}
      onClose={onClose}
      trigger={trigger}
      forceShow={forceShow}
      dialogOpen={dialogOpen}
      onDialogOpenChange={onDialogOpenChange}
    >
      <div className="flex w-full flex-col gap-y-4">
        <FormInput
          form={form}
          id="name"
          name={t(`howto.fields.name.label`)}
          placeholder={t(`howto.fields.name.placeholder`)}
          isRequired
        />
        <div className="space-y-2">
          <Label>{t(`howto.fields.description.label`)}</Label>
          <div className="max-h-80 overflow-y-auto rounded-md border">
            <BlockNoteEditorContainer
              id={form.getValues("id")}
              type="howto"
              initialContent={form.getValues("description")}
              onChange={handleDescriptionChange}
              placeholder={t(`howto.fields.description.placeholder`)}
            />
          </div>
        </div>
        {/* Pages List */}
        <div className="space-y-2">
          <Label>{t(`howto.fields.pages.label`)}</Label>
          <div className="space-y-2">
            {pages.map((page: string, index: number) => (
              <PageSelector
                key={index}
                value={page}
                allPageUrls={allPageUrls}
                selectedPages={pages}
                placeholder={t(`howto.fields.pages.placeholder`)}
                emptyMessage={t(`howto.command.empty`)}
                onSelect={(value) => {
                  const updated = [...pages];
                  updated[index] = value;
                  form.setValue("pages", updated, { shouldDirty: true });
                }}
                onRemove={() => removePage(index)}
              />
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addPage}>
              <PlusIcon className="mr-2 h-4 w-4" />
              {t(`howto.fields.pages.add`)}
            </Button>
          </div>
        </div>
      </div>
    </EditorSheet>
  );
}

export default function HowToEditor(props: HowToEditorProps) {
  return <HowToEditorInternal {...props} />;
}
