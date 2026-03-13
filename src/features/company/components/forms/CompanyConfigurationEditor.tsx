"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Settings2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../../shadcnui";
import { UserInterface } from "../../../user";
import { useCurrentUserContext } from "../../../user/contexts";
import { UserService } from "../../../user/data/user.service";
import { CompanyInput, CompanyInterface } from "../../data";
import { CompanyService } from "../../data/company.service";
import { CompanyConfigurationRegionalForm } from "./CompanyConfigurationRegionalForm";

type CompanyConfigurationEditorProps = {
  company: CompanyInterface;
  currencyOptions?: string[];
};

function CompanyConfigurationEditorInternal({ company, currencyOptions }: CompanyConfigurationEditorProps) {
  const [open, setOpen] = useState<boolean>(false);
  const t = useTranslations();
  const { setUser } = useCurrentUserContext<UserInterface>();

  const defaultValues = useMemo(() => {
    return {
      country: company.configurations?.country ?? "IT",
      currency: company.configurations?.currency ?? "EUR",
    };
  }, [company.configurations]);

  const close = () => {
    setOpen(false);
    form.reset();
  };

  const formSchema = z.object({
    country: z.string().optional(),
    currency: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
    shouldUnregister: false,
  });

  useEffect(() => {
    if (open) {
      form.reset({
        country: company.configurations?.country ?? "IT",
        currency: company.configurations?.currency ?? "EUR",
      });
    }
  }, [company, open]);

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = async (values) => {
    const payload: CompanyInput = {
      id: company.id,
      configurations: {
        country: values.country ?? "IT",
        currency: values.currency ?? "EUR",
      },
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
        <Button size="sm" variant={`ghost`} className="cursor-pointer">
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
            <div className={`flex flex-row gap-x-4`}>
              <div className={`flex w-full flex-col justify-start gap-y-4`}>
                <Tabs defaultValue="regional">
                  <TabsList>
                    <TabsTrigger value="regional">{t("features.configuration.regional_settings")}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="regional">
                    <CompanyConfigurationRegionalForm form={form} currencyOptions={currencyOptions} />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
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
