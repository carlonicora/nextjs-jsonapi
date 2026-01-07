"use client";

import { Button } from "../../../../shadcnui";

export interface OAuthConsentActionsProps {
  /** Called when user clicks Authorize */
  onApprove: () => void;
  /** Called when user clicks Deny */
  onDeny: () => void;
  /** Whether an action is in progress */
  isLoading?: boolean;
}

/**
 * Action buttons for OAuth consent screen
 */
export function OAuthConsentActions({
  onApprove,
  onDeny,
  isLoading = false,
}: OAuthConsentActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button
        variant="outline"
        onClick={onDeny}
        disabled={isLoading}
        className="flex-1"
      >
        Deny
      </Button>
      <Button
        onClick={onApprove}
        disabled={isLoading}
        className="flex-1"
      >
        {isLoading ? "Authorizing..." : "Authorize"}
      </Button>
    </div>
  );
}
