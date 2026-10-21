import { render, screen, waitFor, within } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import { configureI18n } from "../../../../i18n";
import { EmailAutomationEditor } from "../forms/EmailAutomationEditor";

// Hoisted so the vi.mock factories below (which run before the module body)
// can close over them.
const mocks = vi.hoisted(() => ({
  findTriggers: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}));

vi.mock("../../data/EmailAutomationService", () => ({
  EmailAutomationService: {
    findTriggers: mocks.findTriggers,
    create: mocks.create,
    update: mocks.update,
  },
}));

// Base UI renders a closed Select's options nowhere in the DOM, so FormSelect
// is replaced by a stub that prints its label, its empty option and its
// values. Everything else in the barrel stays real.
vi.mock("../../../../components", async () => {
  const actual = await vi.importActual<typeof import("../../../../components")>("../../../../components");
  return {
    ...actual,
    FormSelect: (props: {
      id: string;
      name?: string;
      placeholder?: string;
      allowEmpty?: boolean;
      values: { id: string; text: string }[];
    }) => (
      <div data-testid={`form-select-${props.id}`}>
        <span>{props.name}</span>
        {props.allowEmpty && <span data-value="">{props.placeholder}</span>}
        {props.values.map((value) => (
          <span key={value.id} data-value={value.id}>
            {value.text}
          </span>
        ))}
      </div>
    ),
  };
});

const TRIGGERS = [
  { id: "waitlist-confirmed", key: "waitlist-confirmed", label: "Waitlist confirmed" },
  { id: "registration-completed", key: "registration-completed", label: "Registration completed" },
];

// `Modules.EmailAutomation` resolves through the registry at render time.
beforeAll(() => {
  ModuleRegistry.register("EmailAutomation", {
    name: "email-automations",
    pageUrl: "/administration/email-automations",
  } as any);
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.findTriggers.mockResolvedValue(TRIGGERS);
  configureI18n({
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    }),
    useTranslations: () => (key: string) => key,
    Link: ({ children }: any) => children,
    usePathname: () => "/",
  });
});

describe("EmailAutomationEditor", () => {
  it("renders the five fields by their labels", async () => {
    render(<EmailAutomationEditor forceShow dialogOpen />);

    expect(await screen.findByText("emailAutomations.fields.name.label")).toBeInTheDocument();
    expect(screen.getByText("emailAutomations.fields.trigger.label")).toBeInTheDocument();
    expect(screen.getByText("emailAutomations.fields.exitTrigger.label")).toBeInTheDocument();
    expect(screen.getByText("emailAutomations.fields.replyTo.label")).toBeInTheDocument();
    expect(screen.getByText("emailAutomations.fields.isActive.label")).toBeInTheDocument();
  });

  it("lists the none option plus the trigger labels returned by the API", async () => {
    render(<EmailAutomationEditor forceShow dialogOpen />);

    const triggerSelect = await screen.findByTestId("form-select-trigger");
    await waitFor(() => expect(within(triggerSelect).getByText("Waitlist confirmed")).toBeInTheDocument());

    expect(mocks.findTriggers).toHaveBeenCalled();
    expect(within(triggerSelect).getByText("emailAutomations.fields.trigger.none")).toBeInTheDocument();
    expect(within(triggerSelect).getByText("Registration completed")).toBeInTheDocument();
    // The option values are the trigger keys, the visible text the plain label.
    expect(within(triggerSelect).getByText("Waitlist confirmed")).toHaveAttribute("data-value", "waitlist-confirmed");
  });
});
