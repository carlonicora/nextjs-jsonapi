"use client";

import { MailIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { errorToast } from "../../../../components";
import { Modules } from "../../../../core";
import { Action } from "../../../../permissions";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../../../shadcnui";
import { useCurrentUserContext } from "../../contexts";
import { UserInterface } from "../../data";
import { UserService } from "../../data/user.service";

type UserResentInvitationEmailProps = {
  user: UserInterface;
};

function UserResentInvitationEmailInternal({ user }: UserResentInvitationEmailProps) {
  const [open, setOpen] = useState<boolean>(false);
  const t = useTranslations();

  const sendInvitationEmail = async () => {
    try {
      await UserService.sendInvitation({ userId: user.id, companyId: user.company!.id });

      setOpen(false);
      toast.message(t(`foundations.user.resend_activation.email_sent`), {
        description: t(`foundations.user.resend_activation.email_sent_description`, { email: user.email }),
      });
    } catch (error) {
      errorToast({ title: t(`generic.errors.error`), error: error });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger>
          <DialogTrigger>
            <Button size="sm" variant={`ghost`} className="text-muted-foreground">
              <MailIcon />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>{t(`foundations.user.buttons.resend_activation`)}</TooltipContent>
      </Tooltip>
      <DialogContent className={`flex max-h-[70vh] max-w-3xl flex-col overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle>{t(`foundations.user.resend_activation.title`)}</DialogTitle>
          <DialogDescription>{t(`foundations.user.resend_activation.subtitle`)}</DialogDescription>
        </DialogHeader>
        {t(`foundations.user.resend_activation.description`, { email: user.email })}
        <div className="flex justify-end">
          <Button className="mr-2" variant={"outline"} type={`button`} onClick={() => setOpen(false)}>
            {t(`generic.buttons.cancel`)}
          </Button>
          <Button
            type="submit"
            onClick={(e) => {
              e.preventDefault();
              sendInvitationEmail();
            }}
          >
            {t(`foundations.user.buttons.resend_activation`)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function UserResentInvitationEmail(props: UserResentInvitationEmailProps) {
  const { hasPermissionToModule } = useCurrentUserContext<UserInterface>();
  if (!hasPermissionToModule({ module: Modules.User, action: Action.Update, data: props.user })) return null;

  return <UserResentInvitationEmailInternal {...props} />;
}
