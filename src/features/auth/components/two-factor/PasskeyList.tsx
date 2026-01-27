"use client";

import { Edit, Key, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { errorToast } from "../../../../components/errors/errorToast";
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input } from "../../../../shadcnui";
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
    console.log("[PasskeyList] Attempting to delete passkey:", passkey.id);

    if (!confirm(t("auth.two_factor.confirm_delete_passkey"))) {
      console.log("[PasskeyList] Delete cancelled by user");
      return;
    }

    setIsLoading(true);
    try {
      await TwoFactorService.deletePasskey({ id: passkey.id });
      console.log("[PasskeyList] Passkey deleted successfully:", passkey.id);

      showToast(t("common.success"), {
        description: t("auth.two_factor.passkey_deleted"),
      });
      onRefresh();
    } catch (error) {
      console.error("[PasskeyList] Delete failed:", error);
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

    console.log("[PasskeyList] Renaming passkey:", selectedPasskey.id, "to:", newName.trim());

    setIsLoading(true);
    try {
      await TwoFactorService.renamePasskey({
        id: selectedPasskey.id,
        name: newName.trim(),
      });
      console.log("[PasskeyList] Passkey renamed successfully");

      showToast(t("common.success"), {
        description: t("auth.two_factor.passkey_renamed"),
      });
      setRenameDialogOpen(false);
      setSelectedPasskey(null);
      setNewName("");
      onRefresh();
    } catch (error) {
      console.error("[PasskeyList] Rename failed:", error);
      errorToast({
        title: t("common.errors.error"),
        error,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openRenameDialog = (passkey: PasskeyInterface) => {
    console.log("[PasskeyList] Opening rename dialog for:", passkey.id);
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
              <Button variant="ghost" size="icon" onClick={() => handleDelete(passkey)} disabled={isLoading}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
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
