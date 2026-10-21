"use client";

import { useReactFlow } from "@xyflow/react";
import { ListRestartIcon, MaximizeIcon, MinusIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "../../../../../shadcnui";

export function CanvasToolbar({ onTidy }: { onTidy: () => void | Promise<void> }) {
  const t = useTranslations();
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div data-help="canvas.toolbar" className="absolute end-2 top-2 z-10 flex flex-col gap-1 max-md:top-14">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => zoomIn()}
        aria-label={t("canvas.toolbar.zoomIn")}
      >
        <PlusIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => zoomOut()}
        aria-label={t("canvas.toolbar.zoomOut")}
      >
        <MinusIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => fitView({ duration: 300 })}
        aria-label={t("canvas.toolbar.fitView")}
      >
        <MaximizeIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => void onTidy()}
        title={t("canvas.toolbar.tidyTooltip")}
        aria-label={t("canvas.toolbar.tidy")}
      >
        <ListRestartIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
