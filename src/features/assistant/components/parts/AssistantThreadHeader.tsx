"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { AssistantInterface } from "../../data/AssistantInterface";
import {
  Button,
  Input,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../../shadcnui";

interface Props {
  assistant: AssistantInterface;
  onRename: (title: string) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function AssistantThreadHeader({ assistant, onRename, onDelete }: Props) {
  const t = useTranslations();
  const [renameValue, setRenameValue] = useState(assistant.title);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleRename = async () => {
    const trimmed = renameValue.trim() || assistant.title;
    await onRename(trimmed);
    setRenameOpen(false);
  };

  const handleDelete = async () => {
    await onDelete();
    setDeleteOpen(false);
  };

  return (
    <div className="flex items-center justify-between border-b px-5 py-3">
      <div className="text-foreground text-base font-semibold">{assistant.title}</div>
      <div className="flex items-center gap-2">
        <Popover open={renameOpen} onOpenChange={setRenameOpen}>
          <PopoverTrigger
            render={
              <Button variant="outline" size="sm">
                {t("features.assistant.rename")}
              </Button>
            }
          />
          <PopoverContent className="flex flex-col gap-2 p-3">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder={t("features.assistant.rename_placeholder")}
            />
            <Button onClick={handleRename} size="sm">
              {t("ui.buttons.save")}
            </Button>
          </PopoverContent>
        </Popover>
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogTrigger
            render={
              <Button variant="outline" size="sm" className="text-destructive">
                {t("features.assistant.delete")}
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("features.assistant.delete_confirm")}</DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                {t("ui.buttons.cancel")}
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                {t("ui.buttons.confirm")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
