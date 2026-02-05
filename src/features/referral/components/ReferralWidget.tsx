"use client";

import { Copy, Loader2, Mail, Users } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { Button, Card, Input, Label } from "../../../shadcnui";
import { showError, showToast } from "../../../utils";
import { getReferralConfig, isReferralEnabled } from "../config";
import { useReferralInvite } from "../hooks/useReferralInvite";
import { useReferralStats } from "../hooks/useReferralStats";

/**
 * Default translations for ReferralWidget.
 * These can be overridden via the translations prop.
 */
const DEFAULT_TRANSLATIONS: Required<ReferralWidgetTranslations> = {
  title: "Invite Friends",
  description: "Share your referral link and earn rewards when your friends subscribe.",
  yourLink: "Your referral link",
  copyButton: "Copy",
  copiedMessage: "Link copied to clipboard!",
  statsLabel: "Your referral stats",
  completedLabel: "Successful referrals",
  tokensLabel: "Tokens earned",
  inviteTitle: "Invite by email",
  inviteDescription: "Send an invitation directly to a friend's email.",
  emailPlaceholder: "friend@example.com",
  sendButton: "Send",
  sendingButton: "Sending...",
  inviteSent: "Invitation sent successfully!",
  inviteError: "Failed to send invitation",
  copyError: "Failed to copy link",
  invalidEmail: "Please enter a valid email address",
};

/**
 * Translation strings for the ReferralWidget component.
 * All strings are optional and have defaults.
 */
export interface ReferralWidgetTranslations {
  /** Widget title */
  title?: string;
  /** Widget description */
  description?: string;
  /** Label for the referral link field */
  yourLink?: string;
  /** Copy button label (for screen readers) */
  copyButton?: string;
  /** Toast message when link is copied */
  copiedMessage?: string;
  /** Stats section label */
  statsLabel?: string;
  /** Completed referrals label */
  completedLabel?: string;
  /** Tokens earned label */
  tokensLabel?: string;
  /** Email invite section title */
  inviteTitle?: string;
  /** Email invite description */
  inviteDescription?: string;
  /** Email input placeholder */
  emailPlaceholder?: string;
  /** Send button label */
  sendButton?: string;
  /** Sending button label (while in progress) */
  sendingButton?: string;
  /** Toast message when invite is sent */
  inviteSent?: string;
  /** Error message when invite fails */
  inviteError?: string;
  /** Error message when copy fails */
  copyError?: string;
  /** Error message for invalid email */
  invalidEmail?: string;
}

/**
 * Props for the ReferralWidget component.
 */
export interface ReferralWidgetProps {
  /** Custom translations to override defaults */
  translations?: ReferralWidgetTranslations;
  /** Additional CSS class names */
  className?: string;
  /** Whether to render in dialog mode (no Card wrapper, no header) */
  isDialog?: boolean;
  /** Callback when the referral link is copied */
  onLinkCopied?: () => void;
  /** Callback when an invite is successfully sent */
  onInviteSent?: (email: string) => void;
  /** Callback when an invite fails to send */
  onInviteError?: (error: Error) => void;
}

/**
 * Copy text to clipboard with fallback for non-secure contexts.
 */
async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn("Clipboard API failed, trying fallback:", err);
    }
  }

  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textArea);
    return success;
  } catch (err) {
    console.error("Fallback copy failed:", err);
    return false;
  }
}

/**
 * ReferralWidget displays referral information and allows users to share their referral link.
 *
 * Features:
 * - Shows user's unique referral link
 * - Copy-to-clipboard functionality
 * - Email invite form
 * - Referral stats display
 * - Feature flag awareness (renders null when disabled)
 * - Customizable translations
 * - Optional callback props for events
 *
 * @example
 * ```tsx
 * import { ReferralWidget } from "@carlonicora/nextjs-jsonapi/components";
 *
 * // Basic usage with defaults
 * <ReferralWidget />
 *
 * // With custom translations
 * <ReferralWidget
 *   translations={{
 *     title: t("referral.title"),
 *     description: t("referral.description"),
 *   }}
 *   onLinkCopied={() => analytics.track("referral_link_copied")}
 * />
 * ```
 */
export function ReferralWidget({
  translations,
  className,
  isDialog = false,
  onLinkCopied,
  onInviteSent,
  onInviteError,
}: ReferralWidgetProps) {
  const t = { ...DEFAULT_TRANSLATIONS, ...translations };

  // Call ALL hooks unconditionally at the top (React Rules of Hooks)
  const { stats, loading, error } = useReferralStats();
  const { sendInvite, sending } = useReferralInvite();
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const linkInputRef = useRef<HTMLInputElement>(null);

  // Build referral URL from config
  const config = getReferralConfig();
  const baseUrl = config.referralUrlBase || (typeof window !== "undefined" ? window.location.origin : "");
  const referralUrl = stats?.referralCode
    ? `${baseUrl}${config.referralPath}?${config.urlParamName}=${stats.referralCode}`
    : "";

  // Check feature flag AFTER hooks
  if (!isReferralEnabled()) {
    return null;
  }

  const handleCopyLink = useCallback(async () => {
    if (!referralUrl) return;

    const success = await copyToClipboard(referralUrl);
    if (success) {
      setCopied(true);
      showToast(t.copiedMessage);
      onLinkCopied?.();
      setTimeout(() => setCopied(false), 2000);
    } else {
      showError(t.copyError);
    }
  }, [referralUrl, t.copiedMessage, t.copyError, onLinkCopied]);

  const handleSendInvite = useCallback(async () => {
    if (!email || !email.includes("@")) {
      showError(t.invalidEmail);
      return;
    }

    try {
      await sendInvite(email);
      showToast(t.inviteSent);
      onInviteSent?.(email);
      setEmail("");
    } catch (err) {
      const error = err instanceof Error ? err : new Error(t.inviteError);
      showError(error.message);
      onInviteError?.(error);
    }
  }, [email, sendInvite, t.inviteSent, t.inviteError, t.invalidEmail, onInviteSent, onInviteError]);

  const handleEmailKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !sending) {
        e.preventDefault();
        handleSendInvite();
      }
    },
    [handleSendInvite, sending],
  );

  // Loading state
  if (loading) {
    if (isDialog) {
      return (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </div>
      );
    }
    return (
      <Card className={`p-6 ${className ?? ""}`}>
        <div className="flex items-center justify-center py-4">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to load referral data";
    if (isDialog) {
      return <div className="text-destructive text-center text-sm">{errorMessage}</div>;
    }
    return (
      <Card className={`p-6 ${className ?? ""}`}>
        <div className="text-destructive text-center text-sm">{errorMessage}</div>
      </Card>
    );
  }

  // Main content
  const content = (
    <div className="flex flex-col gap-4">
      {/* Header - only show when not in dialog mode */}
      {!isDialog && (
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 rounded-full p-2">
            <Users className="text-primary h-5 w-5" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold">{t.title}</h3>
            <p className="text-muted-foreground text-sm">{t.description}</p>
          </div>
        </div>
      )}

      {/* Referral Link */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">{t.yourLink}</Label>
        <div className="flex gap-2">
          <Input ref={linkInputRef} value={referralUrl} readOnly className="font-mono text-sm" />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleCopyLink}
            disabled={!referralUrl}
            aria-label={t.copyButton}
          >
            <Copy className={`h-4 w-4 ${copied ? "text-green-500" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Email Invite */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">{t.inviteTitle}</Label>
        <p className="text-muted-foreground text-sm">{t.inviteDescription}</p>
        <div className="flex gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleEmailKeyDown}
            placeholder={t.emailPlaceholder}
            disabled={sending}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleSendInvite}
            disabled={sending || !email}
            aria-label={sending ? t.sendingButton : t.sendButton}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Stats Footer */}
      {stats && stats.completedReferrals > 0 && (
        <div className="border-border border-t pt-3">
          <p className="text-muted-foreground text-sm">
            {t.completedLabel}: {stats.completedReferrals}
          </p>
        </div>
      )}
    </div>
  );

  // Return content directly for dialog mode, wrapped in Card otherwise
  if (isDialog) {
    return content;
  }

  return <Card className={`p-6 ${className ?? ""}`}>{content}</Card>;
}
