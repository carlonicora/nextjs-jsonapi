"use client";

import { DollarSignIcon, UploadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ChangeEvent, Fragment, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ContentListTable, errorToast } from "../../../../../components";
import { Modules } from "../../../../../core";
import { DataListRetriever, useDataListRetriever } from "../../../../../hooks";
import { Button, EmptyState } from "../../../../../shadcnui";
import { usePriceContext } from "../../../contexts/PriceContext";
import { StripePriceFields } from "../../data/stripe-price.fields";
import { StripePriceInterface } from "../../data/stripe-price.interface";
import { StripePriceService } from "../../data/stripe-price.service";
import {
  buildStripePriceTransferDocument,
  parseStripePriceTransferDocument,
  priceToSeed,
  StripePriceSeed,
  stripePriceTransferFilename,
} from "../../data/stripe-price.transfer";
import PriceEditor from "../forms/PriceEditor";

type PricesListProps = {
  productId: string;
  /**
   * Only when the list IS the page's own content inside a `RoundPageContainer
   * fullWidth`. Inside a tab panel leave it unset, or ContentListTable drops its
   * own `rounded-md border` and the table floats borderless in the panel.
   * Mirrors ThreatList, which is rendered both ways.
   */
  fullWidth?: boolean;
};

export function PricesList({ productId, fullWidth }: PricesListProps) {
  const t = useTranslations();
  const { priceVersion } = usePriceContext();
  const importInputRef = useRef<HTMLInputElement>(null);

  // ONE seeded editor serves both clone and import. It is mounted on demand
  // (`seed &&`) rather than kept mounted and toggled, because PriceEditor builds
  // its react-hook-form defaults at construction time — a permanently mounted
  // editor would be constructed with no seed and ignore every later one.
  const [seed, setSeed] = useState<StripePriceSeed | undefined>(undefined);
  // Remount key. Cloning a second row while the first clone's editor has just
  // closed would otherwise reuse the same component instance and keep the first
  // seed's defaults.
  const [seedNonce, setSeedNonce] = useState(0);

  const data: DataListRetriever<StripePriceInterface> = useDataListRetriever({
    retriever: (params) => StripePriceService.listPrices({ ...params, productId }),
    retrieverParams: {},
    module: Modules.StripePrice,
  });

  useEffect(() => {
    if (priceVersion > 0) void data.refresh();
  }, [priceVersion]);

  const openSeededEditor = useCallback((next: StripePriceSeed) => {
    setSeed(next);
    setSeedNonce((nonce) => nonce + 1);
  }, []);

  const onClone = useCallback(
    (price: StripePriceInterface) => openSeededEditor(priceToSeed(price)),
    [openSeededEditor],
  );

  /**
   * Purely client-side: the document is built from the price already in memory,
   * so there is no API round trip. Download mechanics copied verbatim from
   * BackupCodesDialog.handleDownload (Blob -> createObjectURL -> anchor ->
   * click -> revokeObjectURL).
   */
  const onExport = useCallback((price: StripePriceInterface) => {
    const text = JSON.stringify(buildStripePriceTransferDocument(price), null, 2);
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = stripePriceTransferFilename(price);
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Memoised: ContentListTable is `memo`-wrapped and feeds this straight into
  // the table generator, so a fresh object every render would rebuild every
  // column on every render.
  const tableContext = useMemo(() => ({ onClone, onExport }), [onClone, onExport]);

  const onImportFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const input = event.target;
      const file = input.files?.[0];
      // Reset immediately (EditableAvatar.tsx:119-126 does the same) so picking
      // the SAME file twice still fires `change`. Held in `input` rather than
      // read off the event after the await, since the handler is async.
      input.value = "";
      if (!file) return;

      try {
        // NOT named `document`: that shadows the global the export path uses for
        // `document.createElement`, and a later edit that moved code between the
        // two handlers would break silently.
        const transfer = parseStripePriceTransferDocument(await file.text());
        openSeededEditor(transfer.price);
      } catch (error) {
        // The parser's own messages are hardcoded English (it is a pure,
        // i18n-free module), so they are logged for debugging and the user sees
        // the translated line instead.
        console.error("[PricesList] price import failed", error);
        errorToast({
          title: t("billing.admin.prices.import.errors.title"),
          error: t("billing.admin.prices.import.errors.invalid"),
        });
      }
    },
    [openSeededEditor, t],
  );

  const functions: ReactNode[] = [
    <PriceEditor
      key="create-price"
      productId={productId}
      // Present ONLY to suppress navigation: without an `onSuccess`,
      // EditorSheet.wrappedOnSubmit falls through to `onNavigate` and pushes the
      // brand-new price's page, yanking the admin off the product they were
      // editing. Deliberately does NOT call `data.refresh()` — PriceContext's
      // `createPrice` already bumps `priceVersion`, and the effect above
      // refreshes on that, so refreshing here too would fire two identical list
      // requests for one create.
      onSuccess={() => {}}
    />,
    <Fragment key="import-price">
      <Button variant="outline" size="sm" type="button" onClick={() => importInputRef.current?.click()}>
        <UploadIcon />
        {t("billing.admin.prices.actions.import")}
      </Button>
      <input
        ref={importInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={onImportFileChange}
      />
    </Fragment>,
  ];

  return (
    <>
      <ContentListTable
        data={data}
        fields={[
          StripePriceFields.nickname,
          StripePriceFields.amount,
          StripePriceFields.interval,
          StripePriceFields.token,
          StripePriceFields.status,
          StripePriceFields.actions,
        ]}
        tableGeneratorType={Modules.StripePrice}
        functions={functions}
        context={tableContext}
        fullWidth={fullWidth}
        title={t("billing.admin.prices.title")}
        emptyState={
          <EmptyState
            icon={DollarSignIcon}
            title={t("billing.admin.prices.empty.title")}
            description={t("billing.admin.prices.empty.description")}
          />
        }
      />
      {/* Passing `dialogOpen` makes EditorSheet render no trigger at all
          (EditorSheet.tsx:265-267), so this is a headless, caller-driven sheet. */}
      {seed && (
        <PriceEditor
          key={seedNonce}
          productId={productId}
          seed={seed}
          dialogOpen
          onDialogOpenChange={(open) => {
            if (!open) setSeed(undefined);
          }}
          onSuccess={async () => {
            setSeed(undefined);
            await data.refresh();
          }}
        />
      )}
    </>
  );
}
