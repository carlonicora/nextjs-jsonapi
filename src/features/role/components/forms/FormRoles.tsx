"use client";

import { useTranslations } from "next-intl";
import { FormFieldWrapper } from "../../../../components/forms";
import { Checkbox, FieldLabel, Tooltip, TooltipContent, TooltipTrigger } from "../../../../shadcnui";
import { UserInterface } from "../../../user";
import { useCurrentUserContext } from "../../../user/contexts";
import { RoleInterface } from "../../data";

type FormRolesProps = {
  form: any;
  id: string;
  name: string;
  roles: RoleInterface[];
};

export function FormRoles({ form, id, name, roles }: FormRolesProps) {
  const t = useTranslations();
  const { hasAccesToFeature } = useCurrentUserContext<UserInterface>();

  return (
    <div className="flex w-full flex-col">
      <FormFieldWrapper form={form} name={id} label={name}>
        {(field) => (
          <div>
            {roles
              .filter((role: RoleInterface) => role.isSelectable)
              .sort((a: RoleInterface, b: RoleInterface) => a.name.localeCompare(b.name))
              .map((role: RoleInterface) => {
                if (role.requiredFeature && !hasAccesToFeature(role.requiredFeature.id)) return null;

                return (
                  <div key={role.id}>
                    <Checkbox
                      defaultChecked={(field.value as string[]).some((roleId: string) => roleId === role.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          form.setValue(id, [...(field.value as string[]), role.id]);
                        } else {
                          form.setValue(
                            id,
                            (field.value as string[]).filter((roleId: string) => roleId !== role.id),
                          );
                        }
                      }}
                    />
                    <Tooltip>
                      <TooltipTrigger>
                        <FieldLabel className="ml-3 font-normal">
                          {t(`role.roles`, { role: role.id.replaceAll(`-`, ``) })}
                        </FieldLabel>
                      </TooltipTrigger>
                      <TooltipContent>
                        {t(`role.roles_descriptions`, { role: role.id.replaceAll(`-`, ``) })}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                );
              })}
          </div>
        )}
      </FormFieldWrapper>
    </div>
  );
}
