import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
// values. The stub keeps the real FormFieldWrapper (so the description and the
// validation error render as in production) and turns each value into a
// button that sets the field. Everything else in the barrel stays real.
vi.mock("../../../../components", async () => {
  const actual = await vi.importActual<typeof import("../../../../components")>("../../../../components");
  return {
    ...actual,
    FormSelect: (props: {
      form: any;
      id: string;
      name?: string;
      description?: string;
      placeholder?: string;
      allowEmpty?: boolean;
      isRequired?: boolean;
      values: { id: string; text: string }[];
    }) => (
      <div data-testid={`form-select-${props.id}`}>
        <actual.FormFieldWrapper
          form={props.form}
          name={props.id}
          label={props.name}
          description={props.description}
          isRequired={props.isRequired}
        >
          {(field: any) => (
            <>
              {props.allowEmpty && <span data-value="">{props.placeholder}</span>}
              {props.values.map((value) => (
                <button key={value.id} type="button" data-value={value.id} onClick={() => field.onChange(value.id)}>
                  {value.text}
                </button>
              ))}
            </>
          )}
        </actual.FormFieldWrapper>
      </div>
    ),
  };
});

// The sheet is portaled into document.body and its label is not tied to the
// input, so the name field is found by the field name react-hook-form sets.
const nameInput = () => document.querySelector<HTMLInputElement>('input[name="name"]')!;

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
  it("purpose select is required on create", async () => {
    render(<EmailAutomationEditor forceShow dialogOpen />);

    const purposeSelect = await screen.findByTestId("form-select-purpose");
    expect(within(purposeSelect).getByText("emailPurpose.service")).toHaveAttribute("data-value", "service");
    expect(within(purposeSelect).getByText("emailPurpose.marketing")).toHaveAttribute("data-value", "marketing");

    fireEvent.change(nameInput(), {
      target: { value: "Welcome" },
    });
    fireEvent.click(screen.getByTestId("modal-button-create"));

    expect(await within(purposeSelect).findByText("emailPurpose.error")).toBeInTheDocument();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("service purpose shows the warning", async () => {
    render(<EmailAutomationEditor forceShow dialogOpen />);

    const purposeSelect = await screen.findByTestId("form-select-purpose");
    expect(within(purposeSelect).queryByText("emailPurpose.serviceWarning")).not.toBeInTheDocument();

    fireEvent.click(within(purposeSelect).getByText("emailPurpose.service"));
    expect(await within(purposeSelect).findByText("emailPurpose.serviceWarning")).toBeInTheDocument();

    fireEvent.click(within(purposeSelect).getByText("emailPurpose.marketing"));
    await waitFor(() =>
      expect(within(purposeSelect).queryByText("emailPurpose.serviceWarning")).not.toBeInTheDocument(),
    );
  });

  it("payload carries purpose", async () => {
    mocks.create.mockResolvedValue({ id: "a1" });
    render(<EmailAutomationEditor forceShow dialogOpen />);

    const purposeSelect = await screen.findByTestId("form-select-purpose");
    fireEvent.change(nameInput(), {
      target: { value: "Welcome" },
    });
    fireEvent.click(within(purposeSelect).getByText("emailPurpose.service"));
    fireEvent.click(screen.getByTestId("modal-button-create"));

    await waitFor(() => expect(mocks.create).toHaveBeenCalled());
    expect(mocks.create.mock.calls[0][0]).toMatchObject({ name: "Welcome", purpose: "service" });
  });
});
