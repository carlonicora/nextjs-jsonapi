"use client";

import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "../../../../shadcnui";
import { SectionHeader } from "../../../../components/typography";
import { EmailAutomationEnrollmentService } from "../../data/EmailAutomationEnrollmentService";

type UnsubscribeScope = "automation" | "all";

interface Props {
  token: string;
  scope: UnsubscribeScope;
}

type UnsubscribeState = "loading" | "success" | "error";

export function EmailUnsubscribe({ token, scope }: Props) {
  const t = useTranslations();
  const [state, setState] = useState<UnsubscribeState>("loading");
  const [stoppedScope, setStoppedScope] = useState<UnsubscribeScope>(scope);
  const [automationName, setAutomationName] = useState<string>("");
  const [isStoppingAll, setIsStoppingAll] = useState<boolean>(false);

  useEffect(() => {
    async function unsubscribe() {
      try {
        const enrollment = await EmailAutomationEnrollmentService.unsubscribe({ token, scope });
        setAutomationName(enrollment?.automation?.name ?? "");
        setStoppedScope(scope);
        setState("success");
      } catch {
        setState("error");
      }
    }

    unsubscribe();
  }, [token, scope]);

  const stopAll = async () => {
    setIsStoppingAll(true);
    try {
      await EmailAutomationEnrollmentService.unsubscribe({ token, scope: "all" });
      setStoppedScope("all");
    } catch {
      setState("error");
    } finally {
      setIsStoppingAll(false);
    }
  };

  if (state === "loading") {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-16 text-center">
        <Loader2 className="text-primary h-12 w-12 animate-spin" />
        <p className="text-muted-foreground text-sm">{t("emailAutomations.unsubscribe.loading")}</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-16 text-center">
        <div className="bg-destructive/10 rounded-full p-4">
          <XCircle className="text-destructive h-12 w-12" />
        </div>
        <SectionHeader level={2}>{t("emailAutomations.unsubscribe.invalidTitle")}</SectionHeader>
        <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
          {t("emailAutomations.unsubscribe.invalidBody")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-16 text-center">
      <div className="bg-primary/10 rounded-full p-4">
        <CheckCircle className="text-primary h-12 w-12" />
      </div>
      <SectionHeader level={2}>{t("emailAutomations.unsubscribe.title")}</SectionHeader>
      {stoppedScope === "all" ? (
        <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
          {t("emailAutomations.unsubscribe.stoppedAll")}
        </p>
      ) : (
        <>
          <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
            {t("emailAutomations.unsubscribe.stoppedAutomation", { name: automationName })}
          </p>
          <Button variant="secondary" onClick={stopAll} disabled={isStoppingAll}>
            {isStoppingAll && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("emailAutomations.unsubscribe.alsoStopAll")}
          </Button>
        </>
      )}
    </div>
  );
}
