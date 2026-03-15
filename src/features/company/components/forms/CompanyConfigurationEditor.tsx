"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Settings2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ReactNode } from "react";
import { UseFormReturn, useForm } from "react-hook-form";
import { showToast } from "../../../../utils/toast";
import z from "zod";
import { EditorSheet } from "../../../../components";
import { Modules } from "../../../../core";
import { getRoleId } from "../../../../roles";
import { Button } from "../../../../shadcnui";
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
  const t = useTranslations();
  const { setUser } = useCurrentUserContext<UserInterface>();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
    shouldUnregister: false,
  });

  return (
    <EditorSheet
      form={form}
      entityType={t(`entities.configurations`, { count: 2 })}
      entityName={company.name}
      isEdit={true}
      module={Modules.Company}
      size="sm"
      trigger={
        <Button render={<div />} nativeButton={false} size="sm" variant="ghost" className="cursor-pointer">
          <Settings2Icon className="h-3.5 w-3.5" />
        </Button>
      }
      onSubmit={async (values) => {
        const payload: CompanyInput = {
          id: company.id,
          configurations: buildPayload(values),
        };

        await CompanyService.updateConfigurations(payload);

        const fullUser = await UserService.findFullUser();
        if (fullUser) {
          setUser(fullUser);
        }
      }}
      onSuccess={async () => {
        showToast(t("features.configuration.updated_title"), {
          description: t("features.configuration.updated_description"),
        });
      }}
      onReset={() => defaultValues}
    >
      <p className="text-destructive text-sm font-medium">{t(`features.configuration.warning_description`)}</p>
      {children(form)}
    </EditorSheet>
  );
}

export function CompanyConfigurationEditor(props: CompanyConfigurationEditorProps) {
  const { hasRole } = useCurrentUserContext<UserInterface>();

  if (hasRole(getRoleId().Administrator)) return <CompanyConfigurationEditorInternal {...props} />;

  return <CompanyConfigurationEditorInternal {...props} />;
}
