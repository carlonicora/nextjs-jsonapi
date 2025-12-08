"use client";

import { FileIcon, FileImageIcon, FileSpreadsheetIcon, FileTextIcon, UploadIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { DropzoneOptions } from "react-dropzone";
import { cn } from "../../utils";
import { FileInput, FileUploader } from "./FileUploader";

type MultiFileUploaderProps = {
  files: File[];
  setFiles: (files: File[]) => void;
};

const dropzone = {
  multiple: false,
  maxSize: 100 * 1024 * 1024,
  preventDropOnDocument: false,
  accept: {
    "application/images": [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".docx", ".xslx", ".pdf", ".txt", ".md"],
  },
} satisfies DropzoneOptions;

export default function MultiFileUploader({ files, setFiles }: MultiFileUploaderProps) {
  const uploadFiles = (newFiles: File[] | null) => {
    if (!newFiles) return;

    setFiles([...files, ...newFiles]);
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      <FileUploader
        value={files}
        onValueChange={uploadFiles}
        dropzoneOptions={dropzone}
        className="text-muted-foreground hover:text-primary relative aspect-square h-full cursor-pointer overflow-hidden rounded-lg border"
      >
        <FileInput className={cn("text-muted-foreground flex h-full w-full flex-col items-center justify-center")}>
          <UploadIcon className="my-4 h-8 w-8" />
        </FileInput>
      </FileUploader>
      {files.map((file, index) => (
        <FilePreviewItem key={file.name + "-" + index} file={file} onRemoveClick={() => handleRemoveFile(index)} />
      ))}
    </div>
  );
}

const FilePreviewItem = ({ file, onRemoveClick }: { file: File; onRemoveClick: () => void }) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setObjectUrl(null);
  }, [file]);

  const getFileIcon = () => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (file.type.startsWith("image/")) {
      return <FileImageIcon className="text-muted h-10 w-10 sm:h-12 sm:w-12" />;
    }
    if (file.type === "application/pdf") {
      return <FileTextIcon className="text-destructive h-10 w-10 sm:h-12 sm:w-12" />;
    }
    if (file.type.includes("wordprocessingml") || extension === "docx" || extension === "doc") {
      return <FileTextIcon className="text-primary h-10 w-10 sm:h-12 sm:w-12" />;
    }
    if (file.type.includes("spreadsheetml") || extension === "xlsx" || extension === "xls") {
      return <FileSpreadsheetIcon className="text-secondary h-10 w-10 sm:h-12 sm:w-12" />;
    }
    if (file.type.startsWith("text/")) {
      return <FileTextIcon className="h-10 w-10 sm:h-12 sm:w-12" />;
    }
    return <FileIcon className="text-muted h-10 w-10 sm:h-12 sm:w-12" />;
  };

  return (
    <div className="text-muted-foreground group relative aspect-square h-full overflow-hidden rounded-lg border">
      <button
        onClick={onRemoveClick}
        className="absolute top-1.5 right-1.5 z-20 rounded-full bg-black/60 p-1 text-white opacity-0 transition-all duration-200 ease-in-out group-hover:opacity-100 hover:bg-red-600 focus:outline-none"
        aria-label="Remove file"
      >
        <XIcon className="h-3.5 w-3.5" />
      </button>
      {objectUrl ? (
        <Image src={objectUrl} alt={file.name} className="h-full w-full object-cover" width={200} height={200} />
      ) : (
        <div className="bg-muted/30 flex h-full w-full flex-col items-center justify-center p-2">
          {getFileIcon()}
          <span className="text-foreground/80 mt-2 w-full truncate px-1 text-center text-[10px] sm:text-xs">
            {file.name}
          </span>
        </div>
      )}
    </div>
  );
};
