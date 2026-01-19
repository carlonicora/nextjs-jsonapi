"use client";

import { LoaderCircleIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { errorToast } from "../../../../components";
import { Modules } from "../../../../core";
import { usePageUrlGenerator } from "../../../../hooks";
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
import { AuthService } from "../../../auth/data";
import { UserInterface } from "../../../user";
import { useCurrentUserContext } from "../../../user/contexts";
import { CompanyInterface } from "../../data";
import { CompanyService } from "../../data/company.service";

type CompanyDeleterProps = {
  company: CompanyInterface;
};

type CompanyDeleterInternalProps = CompanyDeleterProps & {
  isAdministrator: boolean;
};

function CompanyDeleterInternal({ company, isAdministrator }: CompanyDeleterInternalProps) {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();
  const [open, setOpen] = useState<boolean>(false);
  const [finalWarningOpen, setFinalWarningOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [companyName, setCompanyName] = useState<string>("");

  const handleProceedToFinalWarning = () => {
    setOpen(false);
    setFinalWarningOpen(true);
  };

  const handleFinalDelete = async () => {
    setIsDeleting(true);
    try {
      if (isAdministrator) {
        await CompanyService.delete({ companyId: company.id });
      } else {
        await CompanyService.selfDelete({ companyId: company.id });
      }
      await AuthService.logout();
      window.location.href = generateUrl({ page: `/` });
    } catch (error) {
      errorToast({ title: t(`common.errors.delete`), error: error });
      setIsDeleting(false);
    }
  };

  const handleGoBack = () => {
    setFinalWarningOpen(false);
    setCompanyName("");
  };

  return (
    <>
      {/* Dialog 1: Company Name Confirmation */}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger>
          <Button
            render={<div />}
            nativeButton={false}
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2Icon />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className={`flex max-h-[70vh] max-w-3xl flex-col overflow-y-auto`}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(`common.delete.title`, { type: t(`entities.companies`, { count: 1 }) })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(`common.delete.subtitle`, { type: t(`entities.companies`, { count: 1 }) })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="text-destructive p-4 text-sm">
            {t(`common.delete.description`, { type: t(`entities.companies`, { count: 1 }) })}
          </div>
          <div className="flex w-full flex-col gap-y-2">
            <div>{t(`common.delete.confirmation`, { type: t(`entities.companies`, { count: 1 }) })}</div>
            <div className="flex w-full flex-col">
              <Label className="flex items-center">
                {t(`company.fields.name.label`)}
                <span className="text-destructive ml-2 font-semibold">*</span>
              </Label>
              <Input
                className={`w-full`}
                placeholder={t(`company.fields.name.placeholder`)}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button className="mr-2" variant={"outline"} type={`button`} onClick={() => setOpen(false)}>
              {t(`ui.buttons.cancel`)}
            </Button>
            <Button
              type="submit"
              onClick={(e) => {
                e.preventDefault();
                handleProceedToFinalWarning();
              }}
              variant={"destructive"}
              disabled={company.name !== companyName}
            >
              {t(`ui.buttons.delete`)}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog 2: Final Warning */}
      <AlertDialog open={finalWarningOpen} onOpenChange={setFinalWarningOpen}>
        <AlertDialogContent className={`flex max-h-[70vh] max-w-3xl flex-col overflow-y-auto`}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t(`common.delete.finalWarning.title`)}</AlertDialogTitle>
            <AlertDialogDescription>{t(`common.delete.finalWarning.subtitle`)}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-destructive/10 border-destructive text-destructive rounded-md border p-4 text-sm">
            <p className="mb-3 font-semibold">{t(`common.delete.finalWarning.description`)}</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>{t(`common.delete.finalWarning.bullet1`)}</li>
              <li>{t(`common.delete.finalWarning.bullet2`)}</li>
              <li>{t(`common.delete.finalWarning.bullet3`)}</li>
              <li>{t(`common.delete.finalWarning.bullet4`)}</li>
              <li>{t(`common.delete.finalWarning.bullet5`)}</li>
            </ul>
          </div>
          <div className="flex justify-end">
            <Button className="mr-2" variant={"outline"} type={`button`} onClick={handleGoBack} disabled={isDeleting}>
              {t(`ui.buttons.go_back`)}
            </Button>
            <Button
              type="submit"
              onClick={(e) => {
                e.preventDefault();
                handleFinalDelete();
              }}
              variant={"destructive"}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  {t(`ui.buttons.deleting`)}
                  <LoaderCircleIcon className="animate-spin-slow h-5 w-5" />
                </>
              ) : (
                t(`ui.buttons.delete_forever`)
              )}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function CompanyDeleter({ company }: CompanyDeleterProps) {
  const { hasPermissionToModule, hasRole } = useCurrentUserContext<UserInterface>();

  const isAdministrator = hasRole(getRoleId().Administrator);
  const isCompanyAdministrator = hasRole(getRoleId().CompanyAdministrator);
  const hasDeletePermission = hasPermissionToModule({ module: Modules.Company, action: Action.Delete });

  if (!isAdministrator && !isCompanyAdministrator && !hasDeletePermission) {
    return null;
  }

  return <CompanyDeleterInternal company={company} isAdministrator={isAdministrator} />;
}
