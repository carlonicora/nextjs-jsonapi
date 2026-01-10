"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { setCookie } from "cookies-next";
import { UploadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";
import { DropzoneOptions } from "react-dropzone";
import { SubmitHandler, useForm } from "react-hook-form";
import { v4 } from "uuid";
import { z } from "zod";
import {
  CommonEditorButtons,
  CommonEditorHeader,
  CommonEditorTrigger,
  errorToast,
  FileInput,
  FileUploader,
  FormFeatures,
  FormInput,
} from "../../../../components";
import { Modules } from "../../../../core";
import { usePageUrlGenerator } from "../../../../hooks";
import { useI18nRouter } from "../../../../i18n";
import { getRoleId } from "../../../../roles";
import { Dialog, DialogContent, Form, ScrollArea } from "../../../../shadcnui";
import { FeatureInterface } from "../../../feature";
import { FeatureService } from "../../../feature/data/feature.service";
import { S3Interface } from "../../../s3";
import { S3Service } from "../../../s3/data/s3.service";
import { UserInterface } from "../../../user";
import { useCurrentUserContext } from "../../../user/contexts";
import { CompanyInput, CompanyInterface } from "../../data";
import { CompanyService } from "../../data/company.service";

type CompanyEditorProps = {
  company?: CompanyInterface;
  propagateChanges?: (company: CompanyInterface) => void;
  onRevalidate?: (path: string) => Promise<void>;
};

function CompanyEditorInternal({ company, propagateChanges, onRevalidate }: CompanyEditorProps) {
  const { hasRole } = useCurrentUserContext<UserInterface>();
  const router = useI18nRouter();
  const [open, setOpen] = useState<boolean>(false);
  const [features, setFeatures] = useState<FeatureInterface[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[] | null>(null);
  const [contentType, setContentType] = useState<string | null>(null);
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();

  const formSchema = z.object({
    id: z.uuidv4(),
    name: z.string().min(1, {
      message: t(`company.fields.name.error`),
    }),
    featureIds: z.array(z.string()).optional(),
    moduleIds: z.array(z.string()).optional(),
    logo: z.string().optional(),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: company?.id || v4(),
      name: company?.name || "",
      featureIds: company?.features.map((feature) => feature.id) || [],
      moduleIds: company?.modules.map((module) => module.id) || [],
      logo: company?.logo || "",
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = async (values: z.infer<typeof formSchema>) => {
    if (values.logo && contentType) {
      const s3: S3Interface = await S3Service.getPreSignedUrl({
        key: values.logo,
        contentType: contentType,
        isPublic: true,
      });

      await fetch(s3.url, {
        method: "PUT",
        headers: s3.headers,
        body: file,
      });
    }

    const payload: CompanyInput = {
      id: company?.id ?? v4(),
      name: values.name,
      logo: files && contentType ? values.logo : undefined,
      featureIds: values.featureIds,
      moduleIds: values.moduleIds,
    };

    try {
      const updatedCompany = company ? await CompanyService.update(payload) : await CompanyService.create(payload);

      if (onRevalidate) {
        await onRevalidate(generateUrl({ page: Modules.Company, id: updatedCompany.id, language: `[locale]` }));
      }
      if (company && propagateChanges) {
        setCookie("reloadData", "true", { path: "/" });
        propagateChanges(updatedCompany);
        setOpen(false);
      } else {
        router.push(`/administration/companies/${updatedCompany.id}`);
      }
    } catch (error) {
      errorToast({
        title: company ? t(`common.errors.update`) : t(`common.errors.create`),
        error,
      });
    }
  };

  useEffect(() => {
    async function fetchFeatures() {
      const allfeatures = await FeatureService.findMany({});
      if (hasRole(getRoleId().Administrator)) {
        setFeatures(allfeatures);
      } else {
        setFeatures(allfeatures.filter((feature) => feature.isCore));
      }
    }
    if (
      open &&
      features.length === 0 &&
      (hasRole(getRoleId().Administrator) ||
        (hasRole(getRoleId().CompanyAdministrator) &&
          process.env.NEXT_PUBLIC_PRIVATE_INSTALLATION?.toLowerCase() === "true"))
    )
      fetchFeatures();
  }, [open, features]);

  useEffect(() => {
    if (file && company) {
      const id = form.getValues("id");
      const fileType = file.type;
      let extension = "";

      switch (fileType) {
        default:
          extension = file.type.split("/").pop() ?? "";
          break;
      }

      const timestamp = new Date().toISOString().replace(/[-:T]/g, "").split(".")[0];

      const fileUrl = `companies/${form.getValues("id")}/companies/${id}/${id}.${timestamp}.${extension}`;
      form.setValue("logo", fileUrl);

      setContentType(fileType);
    } else {
      setContentType(null);
    }
  }, [file]);

  useEffect(() => {
    if (files && files.length > 0) {
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

  const canAccessFeatures =
    hasRole(getRoleId().Administrator) ||
    (hasRole(getRoleId().CompanyAdministrator) &&
      process.env.NEXT_PUBLIC_PRIVATE_INSTALLATION?.toLowerCase() === "true");

  const isAdministrator = hasRole(getRoleId().Administrator);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <CommonEditorTrigger isEdit={!!company} />
      <DialogContent
        className={`flex max-h-[70vh] w-full ${isAdministrator || canAccessFeatures ? `max-w-5xl` : `max-w-4xl`} flex-col overflow-y-auto`}
      >
        <CommonEditorHeader type={t(`entities.companies`, { count: 1 })} name={company?.name} />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className={`flex w-full flex-col gap-y-4`}>
            <div className="flex w-full items-start justify-between gap-x-4">
              <div className={`flex w-96 flex-col justify-start gap-y-4`}>
                <FileUploader value={files} onValueChange={setFiles} dropzoneOptions={dropzone} className="w-full p-4">
                  <FileInput className="text-neutral-300 outline-dashed">
                    <div className="flex w-full flex-col items-center justify-center pt-3 pb-4">
                      <div className="flex w-full flex-col items-center justify-center pt-3 pb-4">
                        {file || company?.logo ? (
                          <Image
                            src={file ? URL.createObjectURL(file) : company?.logo || ""}
                            alt="Company Logo"
                            width={200}
                            height={200}
                          />
                        ) : (
                          <>
                            <UploadIcon className="my-4 h-8 w-8" />
                            <p className="mb-1 flex w-full text-center text-sm">{t(`company.click_drag_logo`)}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </FileInput>
                </FileUploader>
              </div>
              <div className={`flex w-full flex-col justify-start gap-y-4`}>
                <FormInput
                  form={form}
                  id="name"
                  name={t(`company.fields.name.label`)}
                  placeholder={t(`company.fields.name.placeholder`)}
                />
              </div>
              {canAccessFeatures && (
                <div className={`flex w-96 flex-col justify-start gap-y-4`}>
                  <ScrollArea className="h-max">
                    <FormFeatures form={form} name={t(`company.features_and_modules`)} features={features} />
                  </ScrollArea>
                </div>
              )}
            </div>
            <CommonEditorButtons form={form} setOpen={setOpen} isEdit={!!company} />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function CompanyEditor(props: CompanyEditorProps) {
  return <CompanyEditorInternal {...props} />;
}
