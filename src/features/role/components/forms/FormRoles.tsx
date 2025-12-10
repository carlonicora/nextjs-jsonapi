"use client";

import { useTranslations } from "next-intl";
import {
  Checkbox,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../../../shadcnui";
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
      <FormField
        control={form.control}
        name={id}
        render={({ field }) => (
          <FormItem className={`${name ? "mb-5" : "mb-1"}`}>
            <FormControl>
              <div>
                <div className="text-sm font-semibold">{name}</div>
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
                          <TooltipTrigger asChild>
                            <FormLabel className="ml-3 font-normal">
                              {t(`foundations.role.roles`, { role: role.id.replaceAll(`-`, ``) })}
                            </FormLabel>
                          </TooltipTrigger>
                          <TooltipContent>
                            {t(`foundations.role.roles_descriptions`, { role: role.id.replaceAll(`-`, ``) })}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    );
                  })}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
