"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { v4 } from "uuid";
import { z } from "zod";
import {
  CommonEditorButtons,
  CommonEditorHeader,
  CommonEditorTrigger,
  errorToast,
  FormCheckbox,
  FormInput,
  FormPassword,
  FormRoles,
  FormTextarea,
} from "../../../../components";
import { useCompanyContext } from "../../../../contexts";
import { Modules } from "../../../../core";
import { useI18nRouter, usePageUrlGenerator } from "../../../../hooks";
import { Action } from "../../../../permissions";
import { getRoleId } from "../../../../roles";
import { Dialog, DialogContent, DialogTrigger, Form } from "../../../../shadcnui";
import { CompanyInterface } from "../../../company/data/company.interface";
import { RoleInterface } from "../../../role";
import { RoleService } from "../../../role/data/role.service";
import { S3Interface } from "../../../s3";
import { S3Service } from "../../../s3/data/s3.service";
import { useCurrentUserContext } from "../../contexts";
import { UserInput, UserInterface } from "../../data";
import { UserService } from "../../data/user.service";
import { UserAvatarEditor } from "./UserAvatarEditor";
import { UserDeleter } from "./UserDeleter";

type UserEditorProps = {
  user?: UserInterface;
  propagateChanges?: (user: UserInterface) => void;
  adminCreated?: boolean;
  trigger?: React.ReactNode;
  onRevalidate?: (path: string) => Promise<void>;
};

function UserEditorInternal({ user, propagateChanges, adminCreated, trigger, onRevalidate }: UserEditorProps) {
  const {
    company: userCompany,
    hasPermissionToModule,
    hasRole,
    currentUser,
    setUser,
  } = useCurrentUserContext<UserInterface>();
  const { company: companyFromContext } = useCompanyContext();
  const generateUrl = usePageUrlGenerator();
  const router = useI18nRouter();
  const [open, setOpen] = useState<boolean>(false);
  const [roles, setRoles] = useState<RoleInterface[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [contentType, setContentType] = useState<string | null>(null);
  const t = useTranslations();
  const [resetImage, setResetImage] = useState<boolean>(false);
  const [company, setCompany] = useState<CompanyInterface | null>(companyFromContext || userCompany);

  useEffect(() => {
    if (!companyFromContext && userCompany) setCompany(userCompany);
  }, [company]);

  const formSchema = z.object({
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
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      try {
        const existingUser = await UserService.findByEmail({ email: values.email });
        if (existingUser) {
          form.setError("email", {
            type: "manual",
            message: t(`user.errors.email_exists`),
          });
          errorToast({ title: t(`user.errors.email_exists`), error: "" });
          return;
        }
      } catch (error) {
        // User does not exist, proceed
      }
    }

    if (values.avatar && contentType) {
      const s3: S3Interface = await S3Service.getPreSignedUrl({
        key: values.avatar,
        contentType: contentType,
        isPublic: true,
      });

      await fetch(s3.url, {
        method: "PUT",
        headers: s3.headers,
        body: file,
      });
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

    try {
      const updatedUser = user
        ? ((await UserService.update(payload)) as UserInterface)
        : ((await UserService.create(payload)) as UserInterface);

      if (currentUser?.id === updatedUser.id) setUser(updatedUser);

      if (onRevalidate) {
        await onRevalidate(generateUrl({ page: Modules.User, id: updatedUser.id, language: `[locale]` }));
      }
      if (propagateChanges) {
        propagateChanges(updatedUser);
        setOpen(false);
      } else {
        router.push(generateUrl({ page: Modules.User, id: updatedUser.id }));
      }
    } catch (error) {
      errorToast({ title: user ? t(`common.errors.update`) : t(`common.errors.create`), error });
    }
  };

  useEffect(() => {
    async function fetchRoles() {
      const roles = await RoleService.findAllRoles({});

      const availableRoles = roles.filter(
        (role: RoleInterface) =>
          role.id !== getRoleId().Administrator &&
          (role.requiredFeature === undefined ||
            company?.features.some((feature) => feature.id === role.requiredFeature?.id)),
      );

      setRoles(availableRoles);
    }

    if (
      open &&
      (company || currentUser?.roles.find((role: RoleInterface) => role.id === getRoleId().Administrator)) &&
      roles.length === 0
    )
      fetchRoles();
  }, [company, open]);

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

      const fileUrl = `companies/${company.id}/users/${id}/${id}.${timestamp}.${extension}`;
      form.setValue("avatar", fileUrl);

      setContentType(fileType);
    } else {
      setContentType(null);
    }
  }, [file]);

  const canChangeRoles =
    !(currentUser?.id === user?.id && hasRole(getRoleId().Administrator)) &&
    (hasPermissionToModule({ module: Modules.User, action: Action.Update }) || hasRole(getRoleId().Administrator));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger>{trigger}</DialogTrigger> : <CommonEditorTrigger isEdit={!!user} />}
      <DialogContent
        className={`flex max-h-[70vh] ${canChangeRoles ? `max-w-[90vw]` : `max-w-3xl`} min-h-3xl max-h-[90vh] flex-col overflow-y-auto`}
      >
        <CommonEditorHeader type={t(`entities.users`, { count: 1 })} name={user?.name} />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className={`flex w-full flex-col gap-y-4`}>
            <div className={`flex flex-row gap-x-4`}>
              <div className={`flex w-40 flex-col justify-start gap-y-2`}>
                <UserAvatarEditor
                  user={user}
                  file={file}
                  setFile={setFile}
                  resetImage={resetImage}
                  setResetImage={setResetImage}
                />
              </div>
              <div className={`flex w-full flex-col justify-start`}>
                <FormInput
                  form={form}
                  id="name"
                  name={t(`user.fields.name.label`)}
                  placeholder={t(`user.fields.name.placeholder`)}
                />
                <FormInput
                  form={form}
                  id="email"
                  name={t(`common.fields.email.label`)}
                  placeholder={t(`common.fields.email.placeholder`)}
                />
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
              </div>
              {canChangeRoles && (
                <div className="flex w-1/3 flex-col">
                  {canChangeRoles && (
                    <FormRoles form={form} id="roleIds" name={t(`entities.roles`, { count: 2 })} roles={roles} />
                  )}
                  {!user && (
                    <div className="flex flex-col gap-y-4">
                      <div className="text-sm font-semibold">{t(`user.send_activation_email`)}</div>
                      <FormCheckbox form={form} id="sendInvitationEmail" name={t(`user.send_activation_email`)} />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-x-4">
              {user && currentUser?.roles.find((role: RoleInterface) => role.id === getRoleId().Administrator) && (
                <UserDeleter
                  companyId={user.company?.id}
                  user={user}
                  onDeleted={() => {
                    setOpen(false);
                    if (propagateChanges) propagateChanges(user);
                  }}
                />
              )}
              <CommonEditorButtons form={form} setOpen={setOpen} isEdit={!!user} />
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
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
