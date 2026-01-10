"use client";

import { UploadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";
import { DropzoneOptions } from "react-dropzone";
import { FileInput, FileUploader } from "../../../../components";
import { Button } from "../../../../shadcnui";
import { UserInterface } from "../../data";

type UserAvatarEditorProps = {
  user?: UserInterface;
  file?: File | null;
  setFile: (file: File | null) => void;
  resetImage: boolean;
  setResetImage: (reset: boolean) => void;
};

export function UserAvatarEditor({ user, file, setFile, resetImage, setResetImage }: UserAvatarEditorProps) {
  const [files, setFiles] = useState<File[] | null>(null);
  const t = useTranslations();

  useEffect(() => {
    if (files && files.length > 0) {
      setResetImage(false);
      setFile(files[0]);
    }
  }, [files]);

  const dropzone = {
    multiple: false,
    maxSize: 100 * 1024 * 1024,
    preventDropOnDocument: false,
    accept: {
      "application/images": [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
    },
  } satisfies DropzoneOptions;

  return (
    <div className="flex w-40 flex-col gap-y-4">
      <FileUploader
        value={files}
        onValueChange={setFiles}
        dropzoneOptions={dropzone}
        className="h-40 w-40 rounded-full p-0"
      >
        <FileInput className="bg-muted text-muted-foreground flex h-full w-full flex-col items-center justify-center">
          {!resetImage && (file || user?.avatar) ? (
            <Image
              src={file ? URL.createObjectURL(file) : user?.avatar || ""}
              alt={t(`common.avatar`)}
              width={200}
              height={200}
            />
          ) : (
            <UploadIcon className="my-4 h-8 w-8" />
          )}
        </FileInput>
      </FileUploader>
      {!resetImage && (file || user?.avatar) && (
        <Button
          className=""
          size={`sm`}
          variant={`outline`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setFile(null);
            setResetImage(true);
          }}
        >
          {t(`ui.buttons.remove`)}
        </Button>
      )}
    </div>
  );
}
