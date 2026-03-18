"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ReactNode, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { v4 } from "uuid";
import { z } from "zod";

import { EditorSheet, FormInput } from "../../../../components";
import { BlockNoteEditorContainer } from "../../../../components";
import { Modules } from "../../../../core";
import { useI18nRouter } from "../../../../hooks";
import { Action } from "../../../../permissions";
import { Button, Input, Label } from "../../../../shadcnui";
import { useCurrentUserContext } from "../../../user/contexts";
import { HowTo } from "../../data/HowTo";
import { HowToInput, HowToInterface } from "../../data/HowToInterface";
import { HowToService } from "../../data/HowToService";

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

        const updatedHowTo = howTo
          ? await HowToService.update(payload)
          : await HowToService.create(payload);

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
            {pages.map((_: string, index: number) => (
              <div key={index} className="flex gap-2">
                <Input
                  {...form.register(`pages.${index}`)}
                  placeholder={t(`howto.fields.pages.placeholder`)}
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="icon" onClick={() => removePage(index)}>
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
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
  const { hasPermissionToModule } = useCurrentUserContext();
  if (
    !hasPermissionToModule({
      module: Modules.HowTo,
      action: props.howTo ? Action.Update : Action.Create,
      data: props.howTo,
    })
  )
    return null;

  return <HowToEditorInternal {...props} />;
}
