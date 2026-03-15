"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { UploadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DropzoneOptions } from "react-dropzone";
import { useForm } from "react-hook-form";
import { v4 } from "uuid";
import { z } from "zod";
import {
  EditorSheet,
  FileInput,
  FileUploader,
  FormFeatures,
  FormInput,
  FormPlaceAutocomplete,
  ItalianFiscalData,
  parseFiscalData,
} from "../../../../components";
import type { FiscalDataHandle } from "../../../../components";
import { Modules } from "../../../../core";
import { useI18nRouter } from "../../../../i18n";
import { getRoleId } from "../../../../roles";
import { ScrollArea } from "../../../../shadcnui";
import { FeatureInterface } from "../../../feature";
import { FeatureService } from "../../../feature/data/feature.service";
import { S3Interface } from "../../../s3";
import { S3Service } from "../../../s3/data/s3.service";
import { UserInterface } from "../../../user";
import { useCurrentUserContext } from "../../../user/contexts";
import { UserService } from "../../../user/data/user.service";
import { CompanyInput, CompanyInterface } from "../../data";
import { CompanyService } from "../../data/company.service";

type CompanyEditorProps = {
  company?: CompanyInterface;
  propagateChanges?: (company: CompanyInterface) => void;
  onRevalidate?: (path: string) => Promise<void>;
  trigger?: ReactNode;
  forceShow?: boolean;
  onClose?: () => void;
  dialogOpen?: boolean;
  onDialogOpenChange?: (open: boolean) => void;
};

function CompanyEditorInternal({
  company,
  propagateChanges,
  onRevalidate,
  trigger,
  forceShow,
  onClose,
  dialogOpen,
  onDialogOpenChange,
}: CompanyEditorProps) {
  const { hasRole, setUser } = useCurrentUserContext<UserInterface>();
  const router = useI18nRouter();
  const [features, setFeatures] = useState<FeatureInterface[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[] | null>(null);
  const [contentType, setContentType] = useState<string | null>(null);
  const t = useTranslations();
  const fiscalRef = useRef<FiscalDataHandle>(null);
  const addressComponentsRef = useRef<Record<string, string>>({});

  const canAccessFeatures =
    hasRole(getRoleId().Administrator) ||
    (hasRole(getRoleId().CompanyAdministrator) &&
      process.env.NEXT_PUBLIC_PRIVATE_INSTALLATION?.toLowerCase() === "true");

  // Fetch features when sheet opens
  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      if (open && features.length === 0 && canAccessFeatures) {
        async function fetchFeatures() {
          const allfeatures = await FeatureService.findMany({});
          if (hasRole(getRoleId().Administrator)) {
            setFeatures(allfeatures);
          } else {
            setFeatures(allfeatures.filter((feature) => feature.isCore));
          }
        }
        fetchFeatures();
      }
      onDialogOpenChange?.(open);
    },
    [features.length, canAccessFeatures, hasRole, onDialogOpenChange],
  );

  const dropzone = {
    multiple: false,
    maxSize: 100 * 1024 * 1024,
    preventDropOnDocument: false,
    accept: {
      "application/images": [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
    },
  } satisfies DropzoneOptions;

  // Handle file selection from dropzone
  useEffect(() => {
    if (files && files.length > 0) {
      setFile(files[0]);
    }
  }, [files]);

  // Generate S3 path when file is selected
  useEffect(() => {
    if (file && company) {
      const id = form.getValues("id");
      const fileType = file.type;
      const extension = fileType.split("/").pop() ?? "";
      const timestamp = new Date().toISOString().replace(/[-:T]/g, "").split(".")[0];
      const fileUrl = `companies/${form.getValues("id")}/companies/${id}/${id}.${timestamp}.${extension}`;
      form.setValue("logo", fileUrl);
      setContentType(fileType);
    } else {
      setContentType(null);
    }
  }, [file]);

  const formSchema = useMemo(
    () =>
      z.object({
        id: z.uuidv4(),
        name: z.string().min(1, {
          message: t(`company.fields.name.error`),
        }),
        featureIds: z.array(z.string()).optional(),
        moduleIds: z.array(z.string()).optional(),
        logo: z.string().optional(),
        legal_address: z.string().optional(),
      }),
    [t],
  );

  const getDefaultValues = useCallback(() => {
    return {
      id: company?.id || v4(),
      name: company?.name || "",
      featureIds: company?.features.map((feature) => feature.id) || [],
      moduleIds: company?.modules.map((module) => module.id) || [],
      logo: company?.logo || "",
      legal_address: company?.legal_address || "",
    };
  }, [company]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  });

  return (
    <EditorSheet
      form={form}
      entityType={t(`entities.companies`, { count: 1 })}
      entityName={company?.name}
      isEdit={!!company}
      module={Modules.Company}
      propagateChanges={propagateChanges}
      size="lg"
      onSubmit={async (values) => {
        // Upload logo to S3 if present
        if (values.logo && contentType && file) {
          const s3: S3Interface = await S3Service.getPreSignedUrl({
            key: values.logo,
            contentType: contentType,
            isPublic: true,
          });

          const response = await fetch(s3.url, {
            method: "PUT",
            headers: s3.headers,
            body: file,
          });

          if (!response.ok) {
            throw new Error(`S3 upload failed: ${response.status}`);
          }
        }

        if (fiscalRef.current && !fiscalRef.current.validate()) {
          throw new Error("Fiscal data validation failed");
        }

        const payload: CompanyInput = {
          id: company?.id ?? v4(),
          name: values.name,
          logo: files && contentType ? values.logo : undefined,
          featureIds: values.featureIds,
          moduleIds: values.moduleIds,
          legal_address: values.legal_address,
          ...addressComponentsRef.current,
          fiscal_data: fiscalRef.current ? JSON.stringify(fiscalRef.current.getData()) : undefined,
        };

        const updatedCompany = company ? await CompanyService.update(payload) : await CompanyService.create(payload);

        // Refresh user context after company changes
        const fullUser = await UserService.findFullUser();
        if (fullUser) {
          setUser(fullUser);
        }

        return updatedCompany;
      }}
      onRevalidate={onRevalidate}
      onNavigate={(url) => router.push(url)}
      onReset={() => {
        setFile(null);
        setFiles(null);
        setContentType(null);
        addressComponentsRef.current = {};
        return getDefaultValues();
      }}
      onClose={onClose}
      trigger={trigger}
      forceShow={forceShow}
      dialogOpen={dialogOpen}
      onDialogOpenChange={handleDialogOpenChange}
    >
      <div className="flex w-full items-start justify-between gap-x-4">
        <div className="flex w-96 flex-col justify-start gap-y-4">
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
        <div className="flex w-full flex-col justify-start gap-y-4">
          <FormInput
            form={form}
            id="name"
            name={t(`company.fields.name.label`)}
            placeholder={t(`company.fields.name.placeholder`)}
          />
          <FormPlaceAutocomplete
            form={form}
            id="legal_address"
            name={t(`company.fields.legal_address.label`)}
            placeholder={t(`company.fields.legal_address.placeholder`)}
            onPlaceSelect={(place) => {
              if (place.addressComponents) {
                addressComponentsRef.current = { ...place.addressComponents };
              }
            }}
          />
          <h3 className="mt-2 text-sm font-semibold">{t(`company.sections.fiscal_data`)}</h3>
          <ItalianFiscalData ref={fiscalRef} initialData={parseFiscalData(company?.fiscal_data)} />
        </div>
        {canAccessFeatures && (
          <div className="flex w-96 flex-col justify-start gap-y-4">
            <ScrollArea className="h-max">
              <FormFeatures form={form} name={t(`company.features_and_modules`)} features={features} />
            </ScrollArea>
          </div>
        )}
      </div>
    </EditorSheet>
  );
}

export function CompanyEditor(props: CompanyEditorProps) {
  return <CompanyEditorInternal {...props} />;
}
