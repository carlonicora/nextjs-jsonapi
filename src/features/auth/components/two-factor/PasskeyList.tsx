"use client";

import { Edit, Key, Trash2 } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "../../../../shadcnui";
import { showToast } from "../../../../utils/toast";
import { PasskeyInterface } from "../../data/passkey.interface";
import { TwoFactorService } from "../../data/two-factor.service";

interface PasskeyListProps {
  passkeys: PasskeyInterface[];
  onRefresh: () => void;
}

export function PasskeyList({ passkeys, onRefresh }: PasskeyListProps) {
  const t = useTranslations();
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedPasskey, setSelectedPasskey] = useState<PasskeyInterface | null>(null);
  const [newName, setNewName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async (passkey: PasskeyInterface) => {
    setIsLoading(true);
    try {
      await TwoFactorService.deletePasskey({ id: passkey.id });

      showToast(t("common.success"), {
        description: t("auth.two_factor.passkey_deleted"),
      });
      onRefresh();
    } catch (error) {
      errorToast({
        title: t("common.errors.error"),
        error,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRename = async () => {
    if (!selectedPasskey || !newName.trim()) return;

    setIsLoading(true);
    try {
      await TwoFactorService.renamePasskey({
        id: selectedPasskey.id,
        name: newName.trim(),
      });

      showToast(t("common.success"), {
        description: t("auth.two_factor.passkey_renamed"),
      });
      setRenameDialogOpen(false);
      setSelectedPasskey(null);
      setNewName("");
      onRefresh();
    } catch (error) {
      errorToast({
        title: t("common.errors.error"),
        error,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openRenameDialog = (passkey: PasskeyInterface) => {
    setSelectedPasskey(passkey);
    setNewName(passkey.name);
    setRenameDialogOpen(true);
  };

  if (passkeys.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">{t("auth.two_factor.no_passkeys")}</p>;
  }

  return (
    <>
      <div className="space-y-2">
        {passkeys.map((passkey) => (
          <div key={passkey.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{passkey.name}</p>
                <p className="text-sm text-muted-foreground">
                  {passkey.backedUp && "☁️ "}
                  {passkey.lastUsedAt
                    ? `${t("auth.two_factor.last_used")}: ${new Date(passkey.lastUsedAt).toLocaleDateString()}`
                    : t("auth.two_factor.never_used")}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => openRenameDialog(passkey)} disabled={isLoading}>
                <Edit className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button variant="ghost" size="icon" disabled={isLoading}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  }
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("auth.two_factor.remove_passkey")}</AlertDialogTitle>
                    <AlertDialogDescription>{t("auth.two_factor.confirm_delete_passkey")}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.buttons.cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(passkey)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {t("common.buttons.delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("auth.two_factor.rename_passkey")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t("auth.two_factor.passkey_name")}
              disabled={isLoading}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleRename} disabled={!newName.trim() || isLoading}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
