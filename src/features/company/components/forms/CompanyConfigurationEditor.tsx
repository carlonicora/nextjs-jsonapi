"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Settings2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";
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
import { UserInterface, UserService } from "../../../user";
import { useCurrentUserContext } from "../../../user/contexts";
import { CompanyInput, CompanyInterface, CompanyService } from "../../data";
import { CompanyConfigurationSecurityForm } from "./CompanyConfigurationSecurityForm";

type CompanyConfigurationEditorProps = {
  company: CompanyInterface;
};

function CompanyConfigurationEditorInternal({ company }: CompanyConfigurationEditorProps) {
  const [open, setOpen] = useState<boolean>(false);
  const t = useTranslations();
  const { setUser } = useCurrentUserContext<UserInterface>();

  const defaultValues = useMemo(() => {
    return {
      isManagedKnowledge: company.configurations?.isManagedKnowledge ?? false,
      allowPublicBot: company.configurations?.allowPublicBot ?? false,
    };
  }, [company.configurations]);

  const close = () => {
    setOpen(false);
    form.reset();
  };

  const formSchema = z.object({
    isManagedKnowledge: z.boolean().optional(),
    allowPublicBot: z.boolean().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
    shouldUnregister: false,
  });

  useEffect(() => {
    if (open) {
      form.reset({
        isManagedKnowledge: company.configurations?.isManagedKnowledge ?? false,
        allowPublicBot: company.configurations?.allowPublicBot ?? false,
      });
    }
  }, [company, open]);

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = async (values) => {
    const payload: CompanyInput = {
      id: company.id,
      configurations: {
        isManagedKnowledge: values.isManagedKnowledge ?? false,
        allowPublicBot: values.allowPublicBot ?? false,
      },
    };

    try {
      await CompanyService.updateConfigurations(payload);

      // Refresh user data to update localStorage with new company configurations
      const fullUser = await UserService.findFullUser();
      if (fullUser) {
        setUser(fullUser);
      }

      toast.message("Configurations Updated", {
        description: `The system configurations have been updated successfully.`,
      });
      close();
    } catch (error) {
      errorToast({
        title: t(`generic.errors.update`),
        error,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={`ghost`} className="cursor-pointer">
          <Settings2Icon className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className={`flex max-h-[70vh] max-w-4xl flex-col overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle>{t(`types.configurations`, { count: 2 })}</DialogTitle>
          <DialogDescription className="text-destructive">
            {t(`features.configuration.warning_description`)}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className={`flex w-full flex-col gap-y-4`}>
            <div className={`flex flex-row gap-x-4`}>
              <div className={`flex w-full flex-col justify-start gap-y-4`}>
                <Tabs defaultValue={process.env.NEXT_PUBLIC_PRIVATE_INSTALLATION ? "security" : "ai"}>
                  <TabsList>
                    <TabsTrigger value="security">Privacy & Security</TabsTrigger>
                  </TabsList>
                  <TabsContent value="features">
                    <div className="space-y-4">
                      <p className="text-muted-foreground text-sm">
                        Feature configuration will be implemented in future updates.
                      </p>
                    </div>
                  </TabsContent>
                  <TabsContent value="security">
                    <CompanyConfigurationSecurityForm form={form} />
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
