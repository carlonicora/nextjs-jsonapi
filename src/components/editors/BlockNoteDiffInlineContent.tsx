import { createReactInlineContentSpec } from "@blocknote/react";
import { CheckIcon, XIcon } from "lucide-react";
import { Button } from "../../shadcnui";
import { cn } from "../../utils";

// Word-level diff with accept/reject functionality
export const diffWordInlineContentSpec = createReactInlineContentSpec(
  {
    type: "diffWord",
    propSchema: {
      text: {
        default: "",
      },
      diffType: {
        default: "unchanged",
      },
      diffId: {
        default: "",
      },
      accepted: {
        default: false,
      },
      rejected: {
        default: false,
      },
      onAccept: {
        default: "",
        type: "string" as const,
      },
      onReject: {
        default: "",
        type: "string" as const,
      },
    },
    content: "none",
  },
  {
    render: (props) => {
      const { text, diffType, diffId, accepted, rejected, onAccept, onReject } = props.inlineContent as any;

      const handleAccept =
        typeof onAccept === "function" ? onAccept : (window as any).blockNoteDiffHandlers?.handleAcceptChange;
      const handleReject =
        typeof onReject === "function" ? onReject : (window as any).blockNoteDiffHandlers?.handleRejectChange;

      if (diffType === "unchanged") {
        return <span>{text}</span>;
      }

      // Handle button-only diffType for rendering accept/reject buttons
      if (diffType === "buttons") {
        const diffIdList = diffId.split(",");
        return (
          <span className="ml-2 inline-flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="m-0 h-6 w-6 p-0 text-green-600 hover:bg-green-50 hover:text-green-700"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (handleAccept) {
                  diffIdList.forEach((id: string) => handleAccept(id.trim()));
                }
              }}
              title="Accept change"
            >
              <CheckIcon className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="m-0 h-6 w-6 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (handleReject) {
                  diffIdList.forEach((id: string) => handleReject(id.trim()));
                }
              }}
              title="Reject change"
            >
              <XIcon className="h-3 w-3" />
            </Button>
          </span>
        );
      }

      const isAddition = diffType === "added";
      const isRemoval = diffType === "removed";

      return (
        <span className="group relative inline-flex items-center">
          <span
            className={cn("rounded-sm px-1 transition-all duration-200", {
              "border border-green-300 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300":
                isAddition && !accepted && !rejected,
              "border border-green-400 bg-green-200 text-green-900": isAddition && accepted,
              "border border-gray-300 bg-gray-100 text-gray-500 line-through": isAddition && rejected,

              "border border-red-300 bg-red-100 text-red-800 line-through dark:bg-red-900/30 dark:text-red-300":
                isRemoval && !accepted && !rejected,
              "border border-gray-400 bg-gray-200 text-gray-600 line-through": isRemoval && accepted,
              "border border-red-400 bg-red-200 text-red-900 line-through": isRemoval && rejected,
            })}
          >
            {text}
          </span>

          {!accepted && !rejected && (diffType === "added" || diffType === "removed") && (
            <span className="absolute -top-8 left-0 z-10 hidden items-center gap-1 rounded border bg-white p-1 shadow-lg group-hover:flex">
              <Button
                size="sm"
                variant="ghost"
                className="m-0 h-6 w-6 p-0 text-green-600 hover:bg-green-50 hover:text-green-700"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (handleAccept) {
                    handleAccept(diffId);
                  }
                }}
                title="Accept change"
              >
                <CheckIcon className="h-5 w-5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="m-0 h-6 w-6 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (handleReject) {
                    handleReject(diffId);
                  }
                }}
                title="Reject change"
              >
                <XIcon className="h-5 w-5" />
              </Button>
            </span>
          )}
        </span>
      );
    },
  },
);

export const diffInlineContentSpecs = {
  diffWord: diffWordInlineContentSpec,
};
