"use client";

import { useTranslations } from "next-intl";
import { AttributeElement } from "../../../../components";
import { Card, CardContent } from "../../../../shadcnui";
import { useRoleContext } from "../../contexts";

export function RoleDetails() {
  const { role } = useRoleContext();
  const t = useTranslations();

  if (!role) return null;

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <AttributeElement title={t(`role.fields.description.label`)} value={role.description} />
      </CardContent>
    </Card>
  );
}
