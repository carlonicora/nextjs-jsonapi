import { beforeAll, describe, expect, it } from "vitest";
import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import { ModuleFactory, ModuleWithPermissions } from "../../../../permissions/types";
import { EmailBlastAudienceModule } from "../../EmailBlastAudienceModule";
import { EmailBlastDeliveryModule } from "../../EmailBlastDeliveryModule";
import { EmailBlastModule } from "../../EmailBlastModule";
import { EmailBlast } from "../EmailBlast";
import { EmailBlastAudience } from "../EmailBlastAudience";

// createJsonApi reads Modules.X.name (resolved lazily via ModuleRegistry), so
// the modules must be registered before a model serialises — same setup as
// email-automation-models.spec.
const moduleFactory: ModuleFactory = (params) =>
  ({
    pageUrl: params.pageUrl,
    name: params.name,
    model: params.model,
  }) as ModuleWithPermissions;

beforeAll(() => {
  ModuleRegistry.register("EmailBlast", EmailBlastModule(moduleFactory));
  ModuleRegistry.register("EmailBlastDelivery", EmailBlastDeliveryModule(moduleFactory));
  ModuleRegistry.register("EmailBlastAudience", EmailBlastAudienceModule(moduleFactory));
});

const hydrate = (attributes: Record<string, unknown>) =>
  ({ jsonApi: { id: "x", type: "t", attributes }, included: [] }) as any;

describe("email blast models", () => {
  it("rehydrate parses sentAt to a Date and defaults counters to 0", () => {
    const sent = new EmailBlast().rehydrate(
      hydrate({
        subject: "News",
        body: "Hello",
        status: "sent",
        sentAt: "2026-10-27T08:00:00.000Z",
        recipientCount: 12,
      }),
    );
    expect(sent.sentAt).toBeInstanceOf(Date);
    expect(sent.sentAt?.toISOString()).toBe("2026-10-27T08:00:00.000Z");
    expect(sent.recipientCount).toBe(12);
    expect(sent.status).toBe("sent");
    expect(sent.sentCount).toBe(0);
    expect(sent.failedCount).toBe(0);
    expect(sent.unsubscribedCount).toBe(0);

    const draft = new EmailBlast().rehydrate(hydrate({ subject: "News", body: "Hello" }));
    expect(draft.sentAt).toBeUndefined();
    expect(draft.recipientCount).toBeUndefined();
    expect(draft.replyTo).toBeUndefined();
    expect(draft.status).toBe("draft");
  });

  it("createJsonApi emits only subject, body and replyTo", () => {
    const body = new EmailBlast().createJsonApi({
      id: "b1",
      subject: "News",
      body: "Hello",
      replyTo: "gm@example.com",
      ...({ status: "sent", sentCount: 3, failedCount: 1, unsubscribedCount: 1, sentAt: new Date() } as object),
    });
    expect(body.data.type).toBe("email-blasts");
    expect(body.data.id).toBe("b1");
    expect(body.data.attributes).toEqual({ subject: "News", body: "Hello", replyTo: "gm@example.com" });
  });

  it("EmailBlastAudience rehydrates recipientCount", () => {
    const audience = new EmailBlastAudience().rehydrate(hydrate({ recipientCount: 42 }));
    expect(audience.recipientCount).toBe(42);
    expect(new EmailBlastAudience().rehydrate(hydrate({})).recipientCount).toBe(0);
  });
});
