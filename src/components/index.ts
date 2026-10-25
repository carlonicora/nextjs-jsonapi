export { EntityAvatar } from "./EntityAvatar";
export { EditableAvatar } from "./EditableAvatar";
export { TableCellAvatar } from "./TableCellAvatar";
export { getInitials } from "../utils/getInitials";
export * from "./containers";
export * from "./contents";
export * from "./details";
export * from "./editors";
export { BlockNoteViewerContainer } from "./viewers/BlockNoteViewerContainer";
export { BlockNoteStaticViewer } from "./viewers/BlockNoteStaticViewer";
export * from "./errors";
export * from "./forms";
export * from "./navigations";
export * from "./pages";
export * from "./tables";
export * from "./typography";
export * from "./grids";
export * from "./fiscal";
export * from "./hero";
export { parseFiscalData } from "../utils/fiscal-utils";

// Feature components
export * from "../features/auth/components";
export * from "../features/administration";
export * from "../features/ai-connection";
// Billing components moved to separate entry point: @carlonicora/nextjs-jsonapi/billing
// Exception: the credit warning banner mounts on every page, so it ships from this
// Stripe-free entry. Its import chain must never reach `@stripe/*`.
export { CreditWarningBanner } from "../features/billing/components/widgets/CreditWarningBanner";
export type { CreditWarningBannerProps } from "../features/billing/components/widgets/CreditWarningBanner";
export { isCreditWarningActive, CREDIT_WARNING_DISMISS_SEGMENT } from "../features/billing/data/credit-warning";
export * from "../features/company/components";
export * from "../features/content/components";
export * from "../features/how-to/components";
export * from "../features/handbook/components";
export * from "../features/assistant/components";
export * from "../features/assistant-message/components";
export * from "../features/assistant-action/components";
export * from "../features/feature/components";
export * from "../features/notification/components";
export * from "../features/onboarding/components";
export * from "../features/referral/components";
export { SignupSourceCapture } from "../features/signup-source/SignupSourceCapture";
export * from "../features/role/components";
export * from "../features/user/components";
export * from "../features/oauth/components";
export * from "../features/waitlist/components";
export { RbacContainer } from "../features/rbac/components/RbacContainer";
export { RbacByRoleContainer } from "../features/rbac/components/RbacByRoleContainer";
export { RbacPermissionCell } from "../features/rbac/components/RbacPermissionCell";
export { RbacPermissionPicker } from "../features/rbac/components/RbacPermissionPicker";

// shadcn/ui components (merged from /shadcnui entry point)
export * from "../shadcnui";

// Icon utilities
export { getIconByModule, getIconByModuleName, getIcon } from "../utils/icons";
