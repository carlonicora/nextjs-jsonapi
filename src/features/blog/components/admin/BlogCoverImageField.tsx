"use client";

import { UploadIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { DropzoneOptions } from "react-dropzone";
import { FileInput, FileUploader, FormFieldWrapper } from "../../../../components";
import { isRemoteImageSrc } from "../../../../utils";
import { S3Service } from "../../../s3/data/s3.service";

/** A picked image waiting to be uploaded: the S3 key is already in the form field. */
export type BlogImageSelection = { file: File; contentType: string } | null;

const dropzone = {
  multiple: false,
  maxSize: 100 * 1024 * 1024,
  preventDropOnDocument: false,
  accept: {
    "application/images": [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
  },
} satisfies DropzoneOptions;

/** Uploads a picked image to its presigned S3 key. */
export async function uploadBlogImage(params: { key: string; selection: BlogImageSelection }): Promise<void> {
  if (!params.selection || !params.key) return;

  await S3Service.upload({
    key: params.key,
    contentType: params.selection.contentType,
    file: params.selection.file,
    isPublic: true,
  });
}

type BlogCoverImageFieldProps = {
  form: any;
  /** The form field that receives the new S3 key ("coverImage" or "image"). */
  id: string;
  label: string;
  /** BLOG_POST_UPLOAD_PREFIX or BLOG_CATEGORY_UPLOAD_PREFIX. */
  keyPrefix: string;
  /** The id of the post or category the image belongs to. */
  entityId: string;
  /** The signed URL of the image already stored, for the preview. */
  currentUrl?: string;
  alt?: string;
  selection: BlogImageSelection;
  onSelectionChange: (selection: BlogImageSelection) => void;
};

/**
 * Dropzone for a post cover or a category image. Picking a file writes its S3
 * key (`<keyPrefix>/<id>/<id>.<timestamp>.<ext>`, under the platform blog root,
 * see BLOG_UPLOAD_ROOT) into the form field and hands
 * the file to the editor, which uploads it with `uploadBlogImage` on submit.
 */
export function BlogCoverImageField({
  form,
  id,
  label,
  keyPrefix,
  entityId,
  currentUrl,
  alt,
  selection,
  onSelectionChange,
}: BlogCoverImageFieldProps) {
  const [files, setFiles] = useState<File[] | null>(null);

  useEffect(() => {
    if (selection === null) setFiles(null);
  }, [selection]);

  const previewUrl = useMemo(() => (selection ? URL.createObjectURL(selection.file) : undefined), [selection]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const src = previewUrl ?? currentUrl;

  return (
    <FormFieldWrapper form={form} name={id} label={label}>
      {(field) => (
        <FileUploader
          value={files}
          onValueChange={(value: File[] | null) => {
            setFiles(value);
            const file = value?.[0];
            if (!file) return;
            const extension = file.type.split("/").pop() ?? "";
            field.onChange(`${keyPrefix}/${entityId}/${entityId}.${Date.now()}.${extension}`);
            onSelectionChange({ file, contentType: file.type });
          }}
          dropzoneOptions={dropzone}
          className="w-full"
        >
          <FileInput className="text-muted-foreground/50 rounded-lg outline-1 outline-dashed">
            <div className="flex w-full flex-col items-center justify-center p-4">
              {src ? (
                <Image
                  src={src}
                  alt={alt ?? label}
                  width={320}
                  height={180}
                  className="h-auto max-h-48 w-auto rounded-md object-cover"
                  unoptimized={isRemoteImageSrc(previewUrl ? undefined : currentUrl)}
                />
              ) : (
                <>
                  <UploadIcon className="my-4 h-8 w-8" />
                  <span className="text-muted-foreground text-xs">{label}</span>
                </>
              )}
            </div>
          </FileInput>
        </FileUploader>
      )}
    </FormFieldWrapper>
  );
}
