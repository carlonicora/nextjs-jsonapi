"use client";

import { Avatar, AvatarFallback, AvatarImage } from "../shadcnui";
import { useCurrentUserContext } from "../contexts";
import { S3Interface } from "../features/s3/data/s3.interface";
import { S3Service } from "../features/s3/data/s3.service";
import { ModuleWithPermissions } from "../permissions";
import { errorToast } from "./errors/errorToast";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";
import { cn } from "../utils/cn";

type EditableAvatarProps = {
  entityId: string;
  module: ModuleWithPermissions;
  image?: string;
  fallback: string;
  alt: string;
  patchImage: (imageKey: string) => Promise<void>;
  className?: string;
  fallbackClassName?: string;
};

export function EditableAvatar({
  entityId,
  module,
  image,
  fallback,
  alt,
  patchImage,
  className,
  fallbackClassName,
}: EditableAvatarProps) {
  const { company } = useCurrentUserContext();
  const t = useTranslations();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Optimistic state: null means "use the prop", string means "override"
  const [optimisticImage, setOptimisticImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const displayImage = optimisticImage ?? image;

  const generateS3Key = useCallback(
    (file: File) => {
      const ext = file.type.split("/").pop() ?? "";
      const ts = new Date().toISOString().replace(/[-:T]/g, "").split(".")[0];
      return `companies/${company!.id}/${module.name}/${entityId}/${entityId}.${ts}.${ext}`;
    },
    [company, module.name, entityId],
  );

  const handleFile = useCallback(
    async (file: File) => {
      if (isUploading) return;
      if (!company) return;

      const previousImage = image;
      const previewUrl = URL.createObjectURL(file);
      setOptimisticImage(previewUrl);
      setIsUploading(true);

      try {
        const s3Key = generateS3Key(file);

        const s3: S3Interface = await S3Service.getPreSignedUrl({
          key: s3Key,
          contentType: file.type,
          isPublic: true,
        });

        const uploadResponse = await fetch(s3.url, {
          method: "PUT",
          headers: s3.headers,
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error(`S3 upload failed: ${uploadResponse.status}`);
        }

        await patchImage(s3Key);
        setOptimisticImage(null);
      } catch (error) {
        setOptimisticImage(previousImage ?? null);
        errorToast({ title: t("generic.errors.update"), error });
      } finally {
        URL.revokeObjectURL(previewUrl);
        setIsUploading(false);
      }
    },
    [company, generateS3Key, image, isUploading, patchImage, t],
  );

  const handleRemove = useCallback(async () => {
    if (isUploading) return;

    const previousImage = image;
    setOptimisticImage("");
    setIsUploading(true);

    try {
      await patchImage("");
      setOptimisticImage(null);
    } catch (error) {
      setOptimisticImage(previousImage ?? null);
      errorToast({ title: t("generic.errors.update"), error });
    } finally {
      setIsUploading(false);
    }
  }, [image, isUploading, patchImage, t]);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className={cn("group relative", className)} onDrop={handleDrop} onDragOver={handleDragOver}>
      <Avatar className="h-full w-full">
        {displayImage ? <AvatarImage src={displayImage} alt={alt} /> : null}
        <AvatarFallback className={fallbackClassName}>{fallback}</AvatarFallback>
      </Avatar>

      {/* Hover overlay */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center gap-x-2 rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100",
          isUploading && "opacity-100",
        )}
      >
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="rounded-full p-2 text-white hover:bg-white/20 disabled:opacity-50"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
        {displayImage && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={isUploading}
            className="rounded-full p-2 text-white hover:bg-white/20 disabled:opacity-50"
          >
            <Trash2Icon className="h-4 w-4" />
          </button>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileInputChange} />
    </div>
  );
}
