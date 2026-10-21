"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { v4 } from "uuid";
import { EmailAutomationInterface } from "../data/EmailAutomationInterface";
import { EmailAutomationService } from "../data/EmailAutomationService";
import { EmailAutomationStepInput, EmailAutomationStepInterface } from "../data/EmailAutomationStepInterface";
import { EmailAutomationStepService } from "../data/EmailAutomationStepService";
import { EmailAutomationTriggerInterface } from "../data/EmailAutomationTriggerInterface";

/** A new step: the provider always sets `automationId` and, when absent, a fresh `id`. */
export type EmailAutomationStepCreateInput = Omit<EmailAutomationStepInput, "id" | "automationId"> & {
  id?: string;
  automationId?: string;
};
/** A step update: the provider always sets `automationId`. */
export type EmailAutomationStepUpdateInput = Omit<EmailAutomationStepInput, "automationId"> & { automationId?: string };

export interface EmailAutomationContextType {
  automation: EmailAutomationInterface | undefined;
  steps: EmailAutomationStepInterface[];
  reload: () => Promise<void>;
  selectedStepId: string | null;
  select: (id: string | null) => void;
  createStep: (input: EmailAutomationStepCreateInput) => Promise<EmailAutomationStepInterface>;
  updateStep: (input: EmailAutomationStepUpdateInput) => Promise<EmailAutomationStepInterface>;
  deleteStep: (id: string) => Promise<void>;
  setNext: (stepId: string, nextStepId: string | null) => Promise<void>;
  updatePosition: (stepId: string, x: number, y: number) => Promise<void>;
  tidy: () => Promise<void>;
  triggers: EmailAutomationTriggerInterface[];
}

const EmailAutomationContext = createContext<EmailAutomationContextType | undefined>(undefined);

export type EmailAutomationProviderProps = {
  automationId: string;
  children: ReactNode;
};

export const EmailAutomationProvider = ({ automationId, children }: EmailAutomationProviderProps) => {
  const [automation, setAutomation] = useState<EmailAutomationInterface | undefined>(undefined);
  const [steps, setSteps] = useState<EmailAutomationStepInterface[]>([]);
  const [triggers, setTriggers] = useState<EmailAutomationTriggerInterface[]>([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [loadedAutomation, loadedSteps] = await Promise.all([
      EmailAutomationService.findOne({ id: automationId }),
      EmailAutomationStepService.findByAutomation({ automationId }),
    ]);
    setAutomation(loadedAutomation);
    setSteps(loadedSteps);
  }, [automationId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    let active = true;
    EmailAutomationService.findTriggers()
      .then((list) => {
        if (active) setTriggers(list);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const select = useCallback((id: string | null) => setSelectedStepId(id), []);

  const createStep = useCallback(
    async (input: EmailAutomationStepCreateInput) => {
      const saved = await EmailAutomationStepService.create({ ...input, id: input.id ?? v4(), automationId });
      await reload();
      return saved;
    },
    [automationId, reload],
  );

  const updateStep = useCallback(
    async (input: EmailAutomationStepUpdateInput) => {
      const saved = await EmailAutomationStepService.update({ ...input, automationId });
      await reload();
      return saved;
    },
    [automationId, reload],
  );

  const deleteStep = useCallback(
    async (id: string) => {
      await EmailAutomationStepService.delete({ id });
      if (selectedStepId === id) setSelectedStepId(null);
      await reload();
    },
    [reload, selectedStepId],
  );

  const setNext = useCallback(
    async (stepId: string, nextStepId: string | null) => {
      if (nextStepId) await EmailAutomationStepService.setNext({ stepId, nextStepId });
      else await EmailAutomationStepService.clearNext({ stepId });
      await reload();
    },
    [reload],
  );

  // PATCH with the step's current attributes plus the new position: the step
  // input type requires subject and body, and sending them unchanged is a no-op.
  const updatePosition = useCallback(
    async (stepId: string, x: number, y: number) => {
      const step = steps.find((candidate) => candidate.id === stepId);
      if (!step) return;
      await EmailAutomationStepService.update({
        id: step.id,
        automationId,
        subject: step.subject,
        body: step.body,
        delayHours: step.delayHours,
        positionX: x,
        positionY: y,
      });
      await reload();
    },
    [automationId, reload, steps],
  );

  const tidy = useCallback(async () => {
    await EmailAutomationService.tidy({ id: automationId });
    await reload();
  }, [automationId, reload]);

  const value = useMemo<EmailAutomationContextType>(
    () => ({
      automation,
      steps,
      reload,
      selectedStepId,
      select,
      createStep,
      updateStep,
      deleteStep,
      setNext,
      updatePosition,
      tidy,
      triggers,
    }),
    [
      automation,
      steps,
      reload,
      selectedStepId,
      select,
      createStep,
      updateStep,
      deleteStep,
      setNext,
      updatePosition,
      tidy,
      triggers,
    ],
  );

  return <EmailAutomationContext.Provider value={value}>{children}</EmailAutomationContext.Provider>;
};

export const useEmailAutomation = (): EmailAutomationContextType => {
  const context = useContext(EmailAutomationContext);
  if (context === undefined) {
    throw new Error("useEmailAutomation must be used within an EmailAutomationProvider");
  }
  return context;
};
