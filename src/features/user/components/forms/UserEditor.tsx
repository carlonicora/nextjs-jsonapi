"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { v4 } from "uuid";
import { z } from "zod";
import { EditorSheet, FormCheckbox, FormInput, FormPassword, FormRoles, FormTextarea } from "../../../../components";
import { useCompanyContext } from "../../../../contexts";
import { Modules } from "../../../../core";
import { useI18nRouter } from "../../../../hooks";
import { Action } from "../../../../permissions";
import { getRoleId } from "../../../../roles";
import { CompanyInterface } from "../../../company/data/company.interface";
import { RoleInterface } from "../../../role";
import { RoleService } from "../../../role/data/role.service";
import { S3Interface } from "../../../s3";
import { S3Service } from "../../../s3/data/s3.service";
import { useCurrentUserContext } from "../../contexts";
import { UserInput, UserInterface } from "../../data";
import { UserService } from "../../data/user.service";
import { UserAvatarEditor } from "./UserAvatarEditor";

type UserEditorProps = {
  user?: UserInterface;
  propagateChanges?: (user: UserInterface) => void;
  adminCreated?: boolean;
  trigger?: ReactNode;
  onRevalidate?: (path: string) => Promise<void>;
  forceShow?: boolean;
  onClose?: () => void;
  dialogOpen?: boolean;
  onDialogOpenChange?: (open: boolean) => void;
};

function UserEditorInternal({
  user,
  propagateChanges,
  adminCreated,
  trigger,
  onRevalidate,
  forceShow,
  onClose,
  dialogOpen,
  onDialogOpenChange,
}: UserEditorProps) {
  const {
    company: userCompany,
    hasPermissionToModule,
    hasRole,
    currentUser,
    setUser,
  } = useCurrentUserContext<UserInterface>();
  const { company: companyFromContext } = useCompanyContext();
  const router = useI18nRouter();
  const [roles, setRoles] = useState<RoleInterface[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [contentType, setContentType] = useState<string | null>(null);
  const [resetImage, setResetImage] = useState<boolean>(false);
  const t = useTranslations();
  const [company, setCompany] = useState<CompanyInterface | null>(companyFromContext || userCompany);

  useEffect(() => {
    if (!companyFromContext && userCompany) setCompany(userCompany);
  }, [company]);

  // Fetch roles when sheet opens
  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      if (
        open &&
        (company || currentUser?.roles.find((role: RoleInterface) => role.id === getRoleId().Administrator)) &&
        roles.length === 0
      ) {
        async function fetchRoles() {
          const allRoles = await RoleService.findAllRoles({});
          const availableRoles = allRoles.filter(
            (role: RoleInterface) =>
              role.id !== getRoleId().Administrator &&
              (role.requiredFeature === undefined ||
                company?.features.some((feature) => feature.id === role.requiredFeature?.id)),
          );
          setRoles(availableRoles);
        }
        fetchRoles();
      }
      onDialogOpenChange?.(open);
    },
    [company, currentUser, roles.length, onDialogOpenChange],
  );

  // Generate S3 path when file is selected
  useEffect(() => {
    if (file && company) {
      const id = form.getValues("id");
      const fileType = file.type;
      const extension = fileType.split("/").pop() ?? "";
      const timestamp = new Date().toISOString().replace(/[-:T]/g, "").split(".")[0];
      const fileUrl = `companies/${company.id}/users/${id}/${id}.${timestamp}.${extension}`;
      form.setValue("avatar", fileUrl);
      setContentType(fileType);
    } else {
      setContentType(null);
    }
  }, [file, company]);

  const formSchema = useMemo(
    () =>
      z.object({
        id: z.uuidv4(),
        name: z.string().min(1, { message: t(`user.fields.name.error`) }),
        email: z.string().min(1, { message: t(`common.fields.email.error`) }),
        password: z.string().optional(),
        title: z.string().optional(),
        bio: z.string().optional(),
        phone: z.string().optional(),
        roleIds: z.array(z.string()).optional(),
        sendInvitationEmail: z.boolean().optional(),
        avatar: z.string().optional(),
      }),
    [t],
  );

  const getDefaultValues = useCallback(() => {
    return {
      id: user?.id || v4(),
      name: user?.name || "",
      title: user?.title || "",
      bio: user?.bio || "",
      email: user?.email || "",
      phone: user?.phone || "",
      password: "",
      roleIds: user?.roles.map((role: RoleInterface) => role.id) || [],
      sendInvitationEmail: false,
      avatar: user?.avatarUrl || "",
    };
  }, [user]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  });

  const canChangeRoles =
    !(currentUser?.id === user?.id && hasRole(getRoleId().Administrator)) &&
    (hasPermissionToModule({ module: Modules.User, action: Action.Update }) || hasRole(getRoleId().Administrator));

  return (
    <EditorSheet
      form={form}
      entityType={t(`entities.users`, { count: 1 })}
      entityName={user?.name}
      isEdit={!!user}
      module={Modules.User}
      propagateChanges={propagateChanges}
      size="md"
      onSubmit={async (values) => {
        // Check for existing email on create
        if (!user) {
          try {
            const existingUser = await UserService.findByEmail({ email: values.email });
            if (existingUser) {
              form.setError("email", {
                type: "manual",
                message: t(`user.errors.email_exists`),
              });
              throw new Error(t(`user.errors.email_exists`));
            }
          } catch (error) {
            if (error instanceof Error && error.message === t(`user.errors.email_exists`)) {
              throw error;
            }
            // User does not exist, proceed
          }
        }

        // Upload avatar to S3 if present
        if (values.avatar && contentType && file) {
          const s3: S3Interface = await S3Service.getPreSignedUrl({
            key: values.avatar,
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

        const payload: UserInput = {
          id: values.id,
          email: values.email,
          name: values.name,
          title: values.title,
          bio: values.bio,
          phone: values.phone,
          password: values.password,
          avatar: resetImage ? undefined : values.avatar,
          roleIds: values.roleIds,
          sendInvitationEmail: values.sendInvitationEmail,
          companyId: company!.id,
          adminCreated: adminCreated,
        };

        const updatedUser = user
          ? ((await UserService.update(payload)) as UserInterface)
          : ((await UserService.create(payload)) as UserInterface);

        if (currentUser?.id === updatedUser.id) setUser(updatedUser);

        return updatedUser;
      }}
      onRevalidate={onRevalidate}
      onNavigate={(url) => router.push(url)}
      onReset={() => {
        setFile(null);
        setContentType(null);
        setResetImage(false);
        setRoles([]);
        return getDefaultValues();
      }}
      onClose={onClose}
      trigger={trigger}
      forceShow={forceShow}
      dialogOpen={dialogOpen}
      onDialogOpenChange={handleDialogOpenChange}
    >
      <div className="flex w-full flex-col gap-y-4">
        <div className="flex w-full gap-x-4">
          <div className="flex w-40 flex-col gap-y-4">
            <UserAvatarEditor
              user={user}
              file={file}
              setFile={setFile}
              resetImage={resetImage}
              setResetImage={setResetImage}
            />
          </div>
          <div className="flex w-full flex-col justify-start gap-y-4">
            <FormInput
              form={form}
              id="name"
              name={t(`user.fields.name.label`)}
              placeholder={t(`user.fields.name.placeholder`)}
              isRequired
            />
            <FormInput
              form={form}
              id="email"
              name={t(`common.fields.email.label`)}
              placeholder={t(`common.fields.email.placeholder`)}
              isRequired
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput
                form={form}
                id="phone"
                name={t(`user.fields.phone.label`)}
                placeholder={t(`user.fields.phone.placeholder`)}
              />
              <FormPassword
                form={form}
                id="password"
                name={t(`user.fields.password.label`)}
                placeholder={t(`user.fields.password.placeholder`)}
              />
            </div>
            <FormInput
              form={form}
              id="title"
              name={t(`user.fields.title.label`)}
              placeholder={t(`user.fields.title.placeholder`)}
            />
            <FormTextarea
              form={form}
              id="bio"
              name={t(`user.fields.bio.label`)}
              placeholder={t(`user.fields.bio.placeholder`)}
              className="min-h-40"
            />
            {canChangeRoles && (
              <div className="flex flex-col gap-y-4">
                <FormRoles form={form} id="roleIds" name={t(`entities.roles`, { count: 2 })} roles={roles} />
                {!user && (
                  <>
                    <div className="text-sm font-semibold">{t(`user.send_activation_email`)}</div>
                    <FormCheckbox form={form} id="sendInvitationEmail" name={t(`user.send_activation_email`)} />
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </EditorSheet>
  );
}

export function UserEditor(props: UserEditorProps) {
  const { hasPermissionToModule } = useCurrentUserContext<UserInterface>();
  if (
    !hasPermissionToModule({
      module: Modules.User,
      action: props.user ? Action.Update : Action.Create,
      data: props.user,
    })
  )
    return null;

  return <UserEditorInternal {...props} />;
}
