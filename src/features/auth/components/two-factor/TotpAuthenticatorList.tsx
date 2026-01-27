"use client";

import { Smartphone, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { errorToast } from "../../../../components/errors/errorToast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Card,
  CardContent,
} from "../../../../shadcnui";
import { showToast } from "../../../../utils/toast";
import { TotpAuthenticatorInterface } from "../../data/totp-authenticator.interface";
import { TwoFactorService } from "../../data/two-factor.service";

interface TotpAuthenticatorListProps {
  authenticators: TotpAuthenticatorInterface[];
  onDelete: () => void;
}

export function TotpAuthenticatorList({ authenticators, onDelete }: TotpAuthenticatorListProps) {
  const t = useTranslations();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await TwoFactorService.deleteTotpAuthenticator({ id });

      showToast(t("common.success"), {
        description: t("auth.two_factor.authenticator_removed"),
      });
      onDelete();
    } catch (error) {
      errorToast({ title: t("common.errors.error"), error });
    } finally {
      setDeletingId(null);
    }
  };

  if (authenticators.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("auth.two_factor.no_authenticators")}</p>;
  }

  return (
    <div className="space-y-2">
      {authenticators.map((auth) => (
        <Card key={auth.id} data-testid={`authenticator-${auth.id}`}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{auth.name}</p>
                {auth.lastUsedAt && (
                  <p className="text-xs text-muted-foreground">
                    {t("auth.two_factor.last_used")}: {auth.lastUsedAt.toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={deletingId === auth.id}
                    data-testid={`delete-auth-${auth.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("auth.two_factor.remove_authenticator")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("auth.two_factor.remove_authenticator_confirm")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("common.buttons.cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(auth.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {t("common.buttons.remove")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
