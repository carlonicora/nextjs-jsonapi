import { beforeAll, describe, expect, it } from "vitest";
import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import { ModuleFactory, ModuleWithPermissions } from "../../../../permissions/types";
import { EmailAutomationEnrollmentModule } from "../../EmailAutomationEnrollmentModule";
import { EmailAutomationModule } from "../../EmailAutomationModule";
import { EmailAutomationStepModule } from "../../EmailAutomationStepModule";
import { EmailAutomationTriggerModule } from "../../EmailAutomationTriggerModule";
import { EmailAutomation } from "../EmailAutomation";
import { EMAIL_AUTOMATION_UNSUBSCRIBE_TYPE, EmailAutomationEnrollment } from "../EmailAutomationEnrollment";
import { EmailAutomationStep } from "../EmailAutomationStep";

// createJsonApi reads Modules.X.name (resolved lazily via ModuleRegistry), so
// the modules must be registered before a model serialises — mirrors the
// tokenusage-admin-models.spec setup convention in this package.
const moduleFactory: ModuleFactory = (params) =>
  ({
    pageUrl: params.pageUrl,
    name: params.name,
    model: params.model,
  }) as ModuleWithPermissions;

beforeAll(() => {
  ModuleRegistry.register("EmailAutomation", EmailAutomationModule(moduleFactory));
  ModuleRegistry.register("EmailAutomationStep", EmailAutomationStepModule(moduleFactory));
  ModuleRegistry.register("EmailAutomationEnrollment", EmailAutomationEnrollmentModule(moduleFactory));
  ModuleRegistry.register("EmailAutomationTrigger", EmailAutomationTriggerModule(moduleFactory));
});

const hydrate = (attributes: Record<string, unknown>) =>
  ({ jsonApi: { id: "x", type: "t", attributes }, included: [] }) as any;

describe("email automation models", () => {
  it("parses the enrollment datetimes into Date, not the wire string", () => {
    const m = new EmailAutomationEnrollment().rehydrate(
      hydrate({
        email: "ada@example.com",
        status: "active",
        enrolledAt: "2026-10-21T08:00:00.000Z",
        nextSendAt: "2026-10-22T08:00:00.000Z",
        attempts: 0,
      }),
    );
    expect(m.enrolledAt).toBeInstanceOf(Date);
    expect(m.enrolledAt.toISOString()).toBe("2026-10-21T08:00:00.000Z");
    expect(m.nextSendAt).toBeInstanceOf(Date);
    expect(m.nextSendAt?.toISOString()).toBe("2026-10-22T08:00:00.000Z");
    expect(m.finishedAt).toBeUndefined();
  });

  it("reads the enrollment computed fields from attributes", () => {
    const m = new EmailAutomationEnrollment().rehydrate(
      hydrate({
        email: "ada@example.com",
        status: "active",
        enrolledAt: "2026-10-21T08:00:00.000Z",
        currentStepSubject: "Welcome aboard",
        sentCount: 2,
      }),
    );
    expect(m.currentStepSubject).toBe("Welcome aboard");
    expect(m.sentCount).toBe(2);
  });

  it("omits undefined automation attributes and includes isActive when given", () => {
    const body = new EmailAutomation().createJsonApi({ id: "a1", name: "Onboarding", isActive: true });
    expect(body.data.type).toBe("email-automations");
    expect(body.data.id).toBe("a1");
    expect(body.data.attributes).toEqual({ name: "Onboarding", isActive: true });
    expect("trigger" in body.data.attributes).toBe(false);
    expect("exitTrigger" in body.data.attributes).toBe(false);
    expect("replyTo" in body.data.attributes).toBe(false);
  });

  it("includes isActive false when given", () => {
    const body = new EmailAutomation().createJsonApi({ id: "a1", name: "Onboarding", isActive: false });
    expect(body.data.attributes.isActive).toBe(false);
  });

  it("writes the step's automation relationship", () => {
    const body = new EmailAutomationStep().createJsonApi({
      id: "s1",
      automationId: "a1",
      subject: "Hello",
      body: "Hi {{name}}",
      delayHours: 24,
    });
    expect(body.data.type).toBe("email-automation-steps");
    expect(body.data.attributes).toEqual({ subject: "Hello", body: "Hi {{name}}", delayHours: 24 });
    expect(body.data.relationships.automation).toEqual({ data: { type: "email-automations", id: "a1" } });
  });

  it("builds the next-step body", () => {
    expect(new EmailAutomationStep().createNextJsonApi({ nextStepId: "s2" })).toEqual({
      data: { type: "email-automation-steps", id: "s2" },
    });
  });

  it("builds the unsubscribe body", () => {
    expect(new EmailAutomationEnrollment().createUnsubscribeJsonApi({ scope: "all" })).toEqual({
      data: { type: EMAIL_AUTOMATION_UNSUBSCRIBE_TYPE, attributes: { scope: "all" } },
    });
  });
});
