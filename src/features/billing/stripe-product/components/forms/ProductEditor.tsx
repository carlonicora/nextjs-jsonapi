"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { v4 } from "uuid";
import { z } from "zod";
import { FormCheckbox, FormInput, FormTextarea } from "../../../../../components";
import { CommonEditorButtons } from "../../../../../components/forms/CommonEditorButtons";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Form } from "../../../../../shadcnui";
import { StripeProductInterface } from "../../data/stripe-product.interface";
import { StripeProductService } from "../../data/stripe-product.service";

type ProductEditorProps = {
  product?: StripeProductInterface;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function ProductEditor({ product, open, onOpenChange, onSuccess }: ProductEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const formSchema = z.object({
    name: z.string().min(1, { message: "Product name is required" }),
    description: z.string().optional(),
    active: z.boolean(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      active: product?.active ?? true,
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = async (values) => {
    console.log("[ProductEditor] Submitting product:", values);
    setIsSubmitting(true);

    try {
      if (product) {
        // Update existing product
        await StripeProductService.updateProduct({
          id: product.id,
          name: values.name,
          description: values.description,
          active: values.active,
        });
        console.log("[ProductEditor] Product updated successfully");
      } else {
        // Create new product
        await StripeProductService.createProduct({
          id: v4(),
          name: values.name,
          description: values.description,
          active: values.active,
        });
        console.log("[ProductEditor] Product created successfully");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("[ProductEditor] Failed to save product:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Create Product"}</DialogTitle>
          <DialogDescription>
            {product ? `Update the details for ${product.name}` : "Create a new product to offer to your customers"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
            <FormInput form={form} id="name" name="Product Name" placeholder="Enter product name" isRequired />

            <FormTextarea
              form={form}
              id="description"
              name="Description"
              placeholder="Enter product description (optional)"
              className="min-h-32"
            />

            <FormCheckbox form={form} id="active" name="Active" />

            <CommonEditorButtons isEdit={!!product} form={form} disabled={isSubmitting} setOpen={onOpenChange} />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
