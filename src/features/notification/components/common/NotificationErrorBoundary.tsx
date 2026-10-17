"use client";

import { useTranslations } from "next-intl";
import React, { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

// Class components cannot call hooks, so the default fallback is a function component.
function NotificationErrorFallback({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations();
  return (
    <div className="flex items-center justify-center p-4 text-center">
      <div className="text-muted-foreground text-sm">
        <p>{t("notification.ui.error_boundary.message")}</p>
        <button onClick={onRetry} className="text-primary mt-2">
          {t("notification.ui.error_boundary.retry")}
        </button>
      </div>
    </div>
  );
}

export class NotificationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("🚨 [NotificationErrorBoundary] Caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <NotificationErrorFallback onRetry={() => this.setState({ hasError: false })} />;
    }

    return this.props.children;
  }
}
