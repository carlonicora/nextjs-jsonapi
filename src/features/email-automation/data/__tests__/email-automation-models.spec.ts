import { beforeAll, describe, expect, it } from "vitest";
import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import { ModuleFactory, ModuleWithPermissions } from "../../../../permissions/types";
import { EmailAutomationCandidateModule } from "../../EmailAutomationCandidateModule";
import { EmailAutomationEnrollmentModule } from "../../EmailAutomationEnrollmentModule";
import { EmailAutomationModule } from "../../EmailAutomationModule";
import { EmailAutomationStepModule } from "../../EmailAutomationStepModule";
import { EmailAutomationTriggerModule } from "../../EmailAutomationTriggerModule";
import { EmailAutomation } from "../EmailAutomation";
import { EmailAutomationCandidate } from "../EmailAutomationCandidate";
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
  ModuleRegistry.register("EmailAutomationCandidate", EmailAutomationCandidateModule(moduleFactory));
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

  it("EmailAutomationCandidate rehydrates kind, id, email, addable and reason", () => {
    const blocked = new EmailAutomationCandidate().rehydrate(
      hydrate({
        recipientType: "waitlist",
        recipientId: "w1",
        email: "ada@example.com",
        addable: false,
        reason: "no_consent",
      }),
    );
    expect(blocked.recipientType).toBe("waitlist");
    expect(blocked.recipientId).toBe("w1");
    expect(blocked.email).toBe("ada@example.com");
    expect(blocked.name).toBeUndefined();
    expect(blocked.addable).toBe(false);
    expect(blocked.reason).toBe("no_consent");

    const open = new EmailAutomationCandidate().rehydrate(
      hydrate({
        recipientType: "user",
        recipientId: "u1",
        email: "grace@example.com",
        name: "Grace",
        addable: true,
        reason: null,
      }),
    );
    expect(open.recipientType).toBe("user");
    expect(open.name).toBe("Grace");
    expect(open.addable).toBe(true);
    expect(open.reason).toBeUndefined();
  });

  it("EmailAutomationCandidate createJsonApi returns type and id only", () => {
    expect(new EmailAutomationCandidate().createJsonApi({ id: "u1" })).toEqual({
      data: { type: "email-automation-candidates", id: "u1" },
    });
  });

  it("EmailAutomationEnrollment.createJsonApi builds type, id, recipientType and recipientId", () => {
    expect(
      new EmailAutomationEnrollment().createJsonApi({ id: "e1", recipientType: "user", recipientId: "u1" }),
    ).toEqual({
      data: {
        type: "email-automation-enrollments",
        id: "e1",
        attributes: { recipientType: "user", recipientId: "u1" },
      },
    });
  });
  it('EmailAutomation rehydrates purpose "service"', () => {
    const m = new EmailAutomation().rehydrate(hydrate({ name: "Welcome", purpose: "service" }));
    expect(m.purpose).toBe("service");
  });

  it("missing purpose rehydrates as marketing", () => {
    expect(new EmailAutomation().rehydrate(hydrate({ name: "Welcome" })).purpose).toBe("marketing");
    expect(new EmailAutomation().rehydrate(hydrate({ name: "Welcome", purpose: "other" })).purpose).toBe("marketing");
  });

  it("createJsonApi sends purpose when set", () => {
    const body = new EmailAutomation().createJsonApi({ id: "a1", name: "Welcome", purpose: "service" });
    expect(body.data.attributes.purpose).toBe("service");
    const without = new EmailAutomation().createJsonApi({ id: "a1", name: "Welcome" });
    expect("purpose" in without.data.attributes).toBe(false);
  });
});
