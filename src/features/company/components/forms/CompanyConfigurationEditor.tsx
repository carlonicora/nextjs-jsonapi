"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Settings2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ReactNode, useEffect, useState } from "react";
import { SubmitHandler, UseFormReturn, useForm } from "react-hook-form";
import { showToast } from "../../../../utils/toast";
import z from "zod";
import { CommonEditorButtons, errorToast } from "../../../../components";
import { getRoleId } from "../../../../roles";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Form,
} from "../../../../shadcnui";
import { UserInterface } from "../../../user";
import { useCurrentUserContext } from "../../../user/contexts";
import { UserService } from "../../../user/data/user.service";
import { CompanyInput, CompanyInterface } from "../../data";
import { CompanyService } from "../../data/company.service";

type CompanyConfigurationEditorProps = {
  company: CompanyInterface;
  formSchema: z.ZodObject<any>;
  defaultValues: Record<string, any>;
  buildPayload: (values: Record<string, any>) => Partial<CompanyInput["configurations"]>;
  children: (form: UseFormReturn<any>) => ReactNode;
};

function CompanyConfigurationEditorInternal({
  company,
  formSchema,
  defaultValues,
  buildPayload,
  children,
}: CompanyConfigurationEditorProps) {
  const [open, setOpen] = useState<boolean>(false);
  const t = useTranslations();
  const { setUser } = useCurrentUserContext<UserInterface>();

  const close = () => {
    setOpen(false);
    form.reset();
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
    shouldUnregister: false,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [company, open]);

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = async (values) => {
    const payload: CompanyInput = {
      id: company.id,
      configurations: buildPayload(values),
    };

    try {
      await CompanyService.updateConfigurations(payload);

      const fullUser = await UserService.findFullUser();
      if (fullUser) {
        setUser(fullUser);
      }

      showToast(t("features.configuration.updated_title"), {
        description: t("features.configuration.updated_description"),
      });
      close();
    } catch (error) {
      errorToast({
        title: t(`common.errors.update`),
        error,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button render={<div />} nativeButton={false} size="sm" variant={`ghost`} className="cursor-pointer">
          <Settings2Icon className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className={`flex max-h-[70vh] max-w-4xl flex-col overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle>{t(`entities.configurations`, { count: 2 })}</DialogTitle>
          <DialogDescription className="text-destructive">
            {t(`features.configuration.warning_description`)}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className={`flex w-full flex-col gap-y-4`}>
            {children(form)}
            <CommonEditorButtons form={form} setOpen={setOpen} isEdit={true} />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function CompanyConfigurationEditor(props: CompanyConfigurationEditorProps) {
  const { hasRole } = useCurrentUserContext<UserInterface>();

  if (hasRole(getRoleId().Administrator)) return <CompanyConfigurationEditorInternal {...props} />;

  return <CompanyConfigurationEditorInternal {...props} />;
}
