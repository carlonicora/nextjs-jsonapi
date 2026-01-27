"use client";

import { TwoFactorSettings } from "../two-factor/TwoFactorSettings";

export function SecurityContainer() {
  return (
    <div className="space-y-6">
      <TwoFactorSettings />
    </div>
  );
}
