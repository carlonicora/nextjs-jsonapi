"use client";

import { LoaderCircleIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { errorToast } from "../../../../components";
import { Modules } from "../../../../core";
import { useI18nRouter } from "../../../../i18n";
import { Action } from "../../../../permissions";
import { getRoleId } from "../../../../roles";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Input,
  Label,
} from "../../../../shadcnui";
import { UserInterface } from "../../../user";
import { useCurrentUserContext } from "../../../user/contexts";
import { CompanyInterface, CompanyService } from "../../data";

type CompanyDeleterProps = {
  company: CompanyInterface;
};

function CompanyDeleterInternal({ company }: CompanyDeleterProps) {
  const t = useTranslations();
  const router = useI18nRouter();
  const [open, setOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [companyName, setCompanyName] = useState<string>("");

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await CompanyService.delete({ companyId: company.id });
      router.push("/");
    } catch (error) {
      errorToast({ title: t(`generic.errors.delete`), error: error });
    }
    setIsDeleting(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant={"destructive"}>
          <Trash2Icon className="mr-3 h-3.5 w-3.5" />
          {t(`generic.buttons.delete`)}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className={`flex max-h-[70vh] max-w-3xl flex-col overflow-y-auto`}>
        <AlertDialogHeader>
          <AlertDialogTitle>{t(`generic.delete.title`, { type: t(`types.companies`, { count: 1 }) })}</AlertDialogTitle>
          <AlertDialogDescription>
            {t(`generic.delete.subtitle`, { type: t(`types.companies`, { count: 1 }) })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="text-destructive p-4 text-sm">
          {t(`generic.delete.description`, { type: t(`types.companies`, { count: 1 }) })}
        </div>
        <div className="flex w-full flex-col gap-y-2">
          <div>{t(`generic.delete.confirmation`, { type: t(`types.companies`, { count: 1 }) })}</div>
          <div className="flex w-full flex-col">
            <Label className="flex items-center">
              {t(`foundations.company.fields.name.label`)}
              <span className="text-destructive ml-2 font-semibold">*</span>
            </Label>
            <Input
              className={`w-full`}
              placeholder={t(`foundations.company.fields.name.placeholder`)}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            className="mr-2"
            variant={"outline"}
            type={`button`}
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            {t(`generic.buttons.cancel`)}
          </Button>
          <Button
            type="submit"
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            variant={"destructive"}
            disabled={company.name !== companyName || isDeleting}
          >
            {isDeleting ? (
              <>
                {t(`generic.buttons.is_deleting`)}
                <LoaderCircleIcon className="animate-spin-slow h-5 w-5" />
              </>
            ) : (
              t(`generic.buttons.delete`)
            )}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function CompanyDeleter({ company }: CompanyDeleterProps) {
  const { hasPermissionToModule, hasRole } = useCurrentUserContext<UserInterface>();

  if (!hasRole(getRoleId().Administrator) && !hasPermissionToModule({ module: Modules.Company, action: Action.Delete }))
    return null;

  return <CompanyDeleterInternal company={company} />;
}
