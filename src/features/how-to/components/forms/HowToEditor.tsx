"use client";

import { HowToInput, HowToInterface } from "@/features/essentials/how-to/data/HowToInterface";
import { HowToService } from "@/features/essentials/how-to/data/HowToService";
import { UserSelector } from "@carlonicora/nextjs-jsonapi/components";
import { useRouter } from "@/i18n/routing";
import { revalidatePaths } from "@/utils/revalidation";
import {
  CommonEditorButtons,
  CommonEditorDiscardDialog,
  CommonEditorHeader,
  CommonEditorTrigger,
  errorToast,
  useEditorDialog,
  FormInput,
  FormTextarea,
} from "@carlonicora/nextjs-jsonapi/components";
import { Modules } from "@carlonicora/nextjs-jsonapi/core";
import { usePageUrlGenerator } from "@carlonicora/nextjs-jsonapi/client";
import { Action } from "@carlonicora/nextjs-jsonapi/core";
import { Dialog, DialogContent, DialogTrigger, Form } from "@carlonicora/nextjs-jsonapi/components";
import { entityObjectSchema } from "@carlonicora/nextjs-jsonapi/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { ReactNode, useCallback, useEffect } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { v4 } from "uuid";
import { z } from "zod";

type HowToEditorProps = {
  howTo?: HowToInterface;
  propagateChanges?: (howTo: HowToInterface) => void;
  trigger?: ReactNode;
  forceShow?: boolean;
  onClose?: () => void;
  dialogOpen?: boolean;
  onDialogOpenChange?: (open: boolean) => void;
};

function HowToEditorInternal({
  howTo,
  propagateChanges,
  trigger,
  forceShow,
  onClose,
  dialogOpen,
  onDialogOpenChange,
}: HowToEditorProps) {
  const router = useRouter();
  const generateUrl = usePageUrlGenerator();
  const t = useTranslations();


  const formSchema = z.object({
    id: z.uuidv4(),
    name: z.string().min(1, {
      message: t(`features.howto.fields.name.error`),
    }),
    description: z.string().min(1, {
      message: t(`features.howto.fields.description.error`),
    }),
    pages: z.string().optional(),
    aiStatus: z.string().optional(),
    author: entityObjectSchema.refine((data) => data.id && data.id.length > 0, {
      message: t(`features.howto.relationships.author.error`),
    }),
  });

  const getDefaultValues = () => ({
    id: howTo?.id || v4(),
    name: howTo?.name || "",
    description: howTo?.description || "",
    pages: howTo?.pages || "",
    aiStatus: howTo?.aiStatus || "",
    author: howTo?.author
      ? { id: howTo.author.id, name: howTo.author.name }
      : undefined,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  });

  const { dirtyFields } = form.formState;

  const isFormDirty = useCallback(() => {
    return Object.keys(dirtyFields).length > 0;
  }, [dirtyFields]);

  const { open, setOpen, handleOpenChange, discardDialogProps } = useEditorDialog(isFormDirty, {
    dialogOpen, onDialogOpenChange, forceShow, onClose,
  });

  useEffect(() => {
    if (!open) {
      form.reset(getDefaultValues());
    }
  }, [open]);



  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = async (values: z.infer<typeof formSchema>) => {
    const payload: HowToInput = {
      id: values.id,
      name: values.name,
      description: values.description,
      pages: values.pages,
      aiStatus: values.aiStatus,
      authorId: values.author?.id,
    };

    try {
      const updatedHowTo = howTo ? await HowToService.update(payload) : await HowToService.create(payload);

      setOpen(false);
      revalidatePaths(generateUrl({ page: Modules.HowTo, id: updatedHowTo.id, language: `[locale]` }));
      if (howTo && propagateChanges) {
        propagateChanges(updatedHowTo);
      } else {
        router.push(generateUrl({ page: Modules.HowTo, id: updatedHowTo.id }));
      }
    } catch (error) {
      errorToast({
        title: howTo ? t(`generic.errors.update`) : t(`generic.errors.create`),
        error,
      });
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {dialogOpen === undefined && (trigger ? <DialogTrigger>{trigger}</DialogTrigger> : <CommonEditorTrigger isEdit={!!howTo} />)}
      <DialogContent
        className="flex max-h-[70vh] max-w-3xl flex-col overflow-y-auto"
      >
        <CommonEditorHeader type={t(`entities.howtos`, { count: 1 })} name={howTo?.name} />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full flex-col gap-y-4">
            <div className="flex flex-col justify-between gap-x-4">
              <FormInput
                form={form}
                id="name"
                name={t(`features.howto.fields.name.label`)}
                placeholder={t(`features.howto.fields.name.placeholder`)}
                isRequired
              />
              <FormTextarea
                className="h-20 min-h-20"
                form={form}
                id="description"
                name={t(`features.howto.fields.description.label`)}
                placeholder={t(`features.howto.fields.description.placeholder`)}
              />
              <FormInput
                form={form}
                id="pages"
                name={t(`features.howto.fields.pages.label`)}
                placeholder={t(`features.howto.fields.pages.placeholder`)}
              />
              <FormInput
                form={form}
                id="aiStatus"
                name={t(`features.howto.fields.aiStatus.label`)}
                placeholder={t(`features.howto.fields.aiStatus.placeholder`)}
              />
              <UserSelector
                id="author"
                form={form}
                label={t(`features.howto.relationships.author.label`)}
                placeholder={t(`features.howto.relationships.author.placeholder`)}
                isRequired
              />
              <CommonEditorButtons form={form} setOpen={handleOpenChange} isEdit={!!howTo} />
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    <CommonEditorDiscardDialog {...discardDialogProps} />
    </>
  );
}

export default function HowToEditor(props: HowToEditorProps) {
  const action = props.howTo ? Action.Update : Action.Create;

  return <HowToEditorInternal {...props} />;
}
