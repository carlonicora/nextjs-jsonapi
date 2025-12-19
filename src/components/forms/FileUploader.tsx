"use client";

import { Trash2 as RemoveIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  createContext,
  Dispatch,
  forwardRef,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { DropzoneOptions, DropzoneState, FileRejection, useDropzone } from "react-dropzone";

export type { DropzoneOptions } from "react-dropzone";
import { toast } from "sonner";
import { buttonVariants, Input } from "../../shadcnui";
import { cn } from "../../utils";

type DirectionOptions = "rtl" | "ltr" | undefined;

type FileUploaderContextType = {
  dropzoneState: DropzoneState;
  isLOF: boolean;
  isFileTooBig: boolean;
  removeFileFromSet: (index: number) => void;
  activeIndex: number;
  setActiveIndex: Dispatch<SetStateAction<number>>;
  orientation: "horizontal" | "vertical";
  direction: DirectionOptions;
};

const FileUploaderContext = createContext<FileUploaderContextType | null>(null);

export const useFileUpload = () => {
  const context = useContext(FileUploaderContext);
  if (!context) {
    throw new Error("useFileUpload must be used within a FileUploaderProvider");
  }
  return context;
};

type FileUploaderProps = {
  value: File[] | null;
  reSelect?: boolean;
  onValueChange: (value: File[] | null) => void;
  dropzoneOptions: DropzoneOptions;
  orientation?: "horizontal" | "vertical";
};

export const FileUploader = forwardRef<HTMLDivElement, FileUploaderProps & React.HTMLAttributes<HTMLDivElement>>(
  (
    { className, dropzoneOptions, value, onValueChange, reSelect, orientation = "vertical", children, dir, ...props },
    ref,
  ) => {
    const [isFileTooBig, setIsFileTooBig] = useState(false);
    const [isLOF, setIsLOF] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const { maxFiles = 1, maxSize = 4 * 1024 * 1024, multiple = true } = dropzoneOptions;
    const t = useTranslations();

    const reSelectAll = maxFiles === 1 ? true : reSelect;
    const direction: DirectionOptions = dir === "rtl" ? "rtl" : "ltr";

    const removeFileFromSet = useCallback(
      (i: number) => {
        if (!value) return;
        const newFiles = value.filter((_, index) => index !== i);
        onValueChange(newFiles);
      },
      [value, onValueChange],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (!value) return;

        const moveNext = () => {
          const nextIndex = activeIndex + 1;
          setActiveIndex(nextIndex > value.length - 1 ? 0 : nextIndex);
        };

        const movePrev = () => {
          const nextIndex = activeIndex - 1;
          setActiveIndex(nextIndex < 0 ? value.length - 1 : nextIndex);
        };

        const prevKey = orientation === "horizontal" ? (direction === "ltr" ? "ArrowLeft" : "ArrowRight") : "ArrowUp";

        const nextKey = orientation === "horizontal" ? (direction === "ltr" ? "ArrowRight" : "ArrowLeft") : "ArrowDown";

        if (e.key === nextKey) {
          moveNext();
        } else if (e.key === prevKey) {
          movePrev();
        } else if (e.key === "Enter" || e.key === "Space") {
          if (activeIndex === -1) {
            dropzoneState.inputRef.current?.click();
          }
        } else if (e.key === "Delete" || e.key === "Backspace") {
          if (activeIndex !== -1) {
            removeFileFromSet(activeIndex);
            if (value.length - 1 === 0) {
              setActiveIndex(-1);
              return;
            }
            movePrev();
          }
        } else if (e.key === "Escape") {
          setActiveIndex(-1);
        }
      },
      [value, activeIndex, removeFileFromSet],
    );

    const onDrop = useCallback(
      (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
        const files = acceptedFiles;

        if (!files) {
          toast.error(t("generic.errors.file"), {
            description: t("generic.errors.file_large"),
          });
          return;
        }

        const newValues: File[] = value ? [...value] : [];

        if (reSelectAll) {
          newValues.splice(0, newValues.length);
        }

        files.forEach((file) => {
          if (newValues.length < maxFiles) {
            newValues.push(file);
          }
        });

        onValueChange(newValues);

        if (rejectedFiles.length > 0) {
          for (let i = 0; i < rejectedFiles.length; i++) {
            if (rejectedFiles[i].errors[0]?.code === "file-too-large") {
              toast.error(t("generic.errors.file"), {
                description: t(`generic.errors.file_max`, { size: maxSize / 1024 / 1024 }),
              });
              break;
            }
            if (rejectedFiles[i].errors[0]?.message) {
              toast.error(t(`generic.errors.file`), {
                description: rejectedFiles[i].errors[0].message,
              });
              break;
            }
          }
        }
      },
      [reSelectAll, value],
    );

    useEffect(() => {
      if (!value) return;
      if (value.length === maxFiles) {
        // setIsLOF(true);
        return;
      }
      setIsLOF(false);
    }, [value, maxFiles]);

    const opts = dropzoneOptions ? dropzoneOptions : { maxFiles, maxSize, multiple };

    const dropzoneState = useDropzone({
      ...opts,
      onDrop,
      onDropRejected: () => setIsFileTooBig(true),
      onDropAccepted: () => setIsFileTooBig(false),
    });

    const { isDragActive } = dropzoneState; // Correctly get isDragActive

    return (
      <FileUploaderContext.Provider
        value={{
          dropzoneState,
          isLOF,
          isFileTooBig,
          removeFileFromSet,
          activeIndex,
          setActiveIndex,
          orientation,
          direction,
        }}
      >
        <div
          ref={ref}
          tabIndex={0}
          onKeyDownCapture={handleKeyDown}
          className={cn(
            "grid w-full overflow-hidden focus:outline-none",
            className, // Original className from props
            {
              "gap-2": value && value.length > 0,
              "bg-muted border-primary border-dashed": isDragActive, // Apply drag-active styles to the main FileUploader div
            },
          )}
          dir={dir}
          {...props}
        >
          {children}
        </div>
      </FileUploaderContext.Provider>
    );
  },
);

FileUploader.displayName = "FileUploader";

export const FileUploaderContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => {
    const { orientation } = useFileUpload();
    const containerRef = useRef<HTMLDivElement>(null);

    return (
      <div className={cn("w-full px-1")} ref={containerRef} aria-description="content file holder">
        <div
          {...props}
          ref={ref}
          className={cn(
            "flex gap-1 rounded-xl",
            orientation === "horizontal" ? "flex-raw flex-wrap" : "flex-col",
            className,
          )}
        >
          {children}
        </div>
      </div>
    );
  },
);

FileUploaderContent.displayName = "FileUploaderContent";

export const FileUploaderItem = forwardRef<HTMLDivElement, { index: number } & React.HTMLAttributes<HTMLDivElement>>(
  ({ className, index, children, ...props }, ref) => {
    const { removeFileFromSet, activeIndex, direction } = useFileUpload();
    const isSelected = index === activeIndex;
    const t = useTranslations();

    return (
      <div
        ref={ref}
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "relative h-6 cursor-pointer justify-between p-1",
          className,
          isSelected ? "bg-muted" : "",
        )}
        {...props}
      >
        <div className="flex h-full w-full items-center gap-1.5 leading-none font-medium tracking-tight">
          {children}
        </div>
        <button
          type="button"
          className={cn("absolute", direction === "rtl" ? "top-1 left-1" : "top-1 right-1")}
          onClick={() => removeFileFromSet(index)}
        >
          <span className="sr-only">{t(`generic.remove_item`, { index: index })}</span>
          <RemoveIcon className="hover:stroke-destructive h-4 w-4 duration-200 ease-in-out" />
        </button>
      </div>
    );
  },
);

FileUploaderItem.displayName = "FileUploaderItem";

export const FileInput = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const { dropzoneState, isFileTooBig, isLOF } = useFileUpload();
    const rootProps = isLOF ? {} : dropzoneState.getRootProps();
    // Get isDragActive from the context for FileInput as well, to ensure it can react if needed, or to simplify its own styling.
    const { isDragActive: parentIsDragActive } = dropzoneState;

    return (
      <div
        ref={ref}
        {...props}
        className={cn(`relative w-full ${isLOF ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`, className)}
      >
        <div
          className={cn(
            "w-full rounded-lg duration-300 ease-in-out",
            // Simpler border logic: if parent is drag-active, it controls the border.
            // Otherwise, FileInput can show its own accept/reject/default border.
            {
              "border-green-500": dropzoneState.isDragAccept && !parentIsDragActive,
              "border-red-500": (dropzoneState.isDragReject || isFileTooBig) && !parentIsDragActive,
              "border-gray-300":
                !dropzoneState.isDragAccept && !dropzoneState.isDragReject && !isFileTooBig && !parentIsDragActive,
            },
            // className from props should be last to allow overrides if necessary
            className,
          )}
          {...rootProps}
        >
          {children}
        </div>
        <Input
          ref={dropzoneState.inputRef}
          disabled={isLOF}
          {...dropzoneState.getInputProps()}
          className={`${isLOF ? "cursor-not-allowed" : ""}`}
        />
      </div>
    );
  },
);

FileInput.displayName = "FileInput";
