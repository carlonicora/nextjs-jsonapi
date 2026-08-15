"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { ReactNode, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { v4 } from "uuid";
import { z } from "zod";
import { EditorSheet, FormInput, FormTextarea } from "../../../../../components";
import { Modules } from "../../../../../core";
import { useI18nRouter } from "../../../../../i18n";
import { useProductContext } from "../../../contexts/ProductContext";
import { StripeProductInterface } from "../../data/stripe-product.interface";

export type ProductEditorProps = {
  product?: StripeProductInterface;
  propagateChanges?: (product: StripeProductInterface) => void;
  onSuccess?: () => void | Promise<void>;
  trigger?: ReactNode;
  forceShow?: boolean;
  onClose?: () => void;
  dialogOpen?: boolean;
  onDialogOpenChange?: (open: boolean) => void;
};

function ProductEditorInternal({
  product,
  propagateChanges,
  onSuccess,
  trigger,
  forceShow,
  onClose,
  dialogOpen,
  onDialogOpenChange,
}: ProductEditorProps) {
  const t = useTranslations();
  const router = useI18nRouter();
  const { createProduct, updateProduct } = useProductContext();
  const isEdit = !!product;

  const formSchema = useMemo(
    () =>
      z.object({
        id: z.uuidv4(),
        name: z.string().min(1, { message: t("billing.admin.products.errors.name") }),
        description: z.string().optional(),
      }),
    [t],
  );

  // `active` is deliberately absent: archiving is the single deactivation path
  // (ProductArchiver), and a second toggle here would let the two disagree.
  const getDefaultValues = useCallback(
    () => ({
      id: product?.id ?? v4(),
      name: product?.name ?? "",
      description: product?.description ?? "",
    }),
    [product],
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  });

  return (
    <EditorSheet
      form={form}
      entityType={t("billing.admin.products.entity")}
      entityName={product?.name}
      isEdit={isEdit}
      module={Modules.StripeProduct}
      size="md"
      propagateChanges={propagateChanges}
      onSuccess={onSuccess}
      onNavigate={(url) => router.push(url)}
      onSubmit={async (values) => {
        const payload = { id: values.id, name: values.name, description: values.description };
        return isEdit ? await updateProduct(payload) : await createProduct(payload);
      }}
      onReset={getDefaultValues}
      trigger={trigger}
      forceShow={forceShow}
      onClose={onClose}
      dialogOpen={dialogOpen}
      onDialogOpenChange={onDialogOpenChange}
    >
      <div className="flex w-full flex-col gap-y-4">
        <FormInput
          form={form}
          id="name"
          name={t("billing.admin.products.fields.name")}
          placeholder={t("billing.admin.products.placeholders.name")}
          isRequired
        />
        <FormTextarea
          form={form}
          id="description"
          name={t("billing.admin.products.fields.description")}
          placeholder={t("billing.admin.products.placeholders.description")}
          className="min-h-32"
        />
      </div>
    </EditorSheet>
  );
}

export default function ProductEditor(props: ProductEditorProps) {
  return <ProductEditorInternal {...props} />;
}
