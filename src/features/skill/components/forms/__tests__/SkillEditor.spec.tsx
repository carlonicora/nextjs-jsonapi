import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ModuleRegistry } from "../../../../../core/registry/ModuleRegistry";
import type { SkillInterface } from "../../../data/SkillInterface";
import { SkillEditor } from "../SkillEditor";

const { SkillService, errorToast } = vi.hoisted(() => ({
  SkillService: {
    findOne: vi.fn(),
    findOneGlobal: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    createGlobal: vi.fn(),
    updateGlobal: vi.fn(),
    deleteGlobal: vi.fn(),
  },
  errorToast: vi.fn(),
}));

vi.mock("../../../data/SkillService", () => ({ SkillService }));
vi.mock("../../../../../components/errors/errorToast", () => ({ errorToast }));

// Keys come back as-is; parameters are appended so counters can be read.
vi.mock("next-intl", () => ({
  useTranslations: () => {
    const t = (key: string, params?: Record<string, unknown>) =>
      params && Object.keys(params).length ? `${key}:${JSON.stringify(params)}` : key;
    (t as any).has = () => true;
    return t;
  },
}));

vi.mock("../../../../../hooks/usePageUrlGenerator", () => ({
  usePageUrlGenerator: () => () => "/test",
}));

vi.mock("../../../../../i18n", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../../i18n")>()),
  useI18nRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

beforeAll(() => {
  ModuleRegistry.register("Skill" as any, { name: "skills", pageUrl: "/administration/skills" } as any);
});

function makeSkill(overrides: Partial<Record<keyof SkillInterface, unknown>> = {}): SkillInterface {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    name: "quote",
    description: "How we write quotes",
    instructions: "",
    isActive: true,
    isGlobal: false,
    origin: "company",
    isEnabled: true,
    isHidden: false,
    canRestore: false,
    ...overrides,
  } as unknown as SkillInterface;
}

function httpError(status: number, message: string) {
  const error = new Error(`${status}:${message}`) as Error & { status: number };
  error.status = status;
  return error;
}

const nameInput = () => screen.getByTestId("skill-editor-name") as HTMLInputElement;
const descriptionInput = () => screen.getByTestId("skill-editor-description") as HTMLInputElement;
const instructionsInput = () =>
  document.querySelector('textarea[data-testid="skill-editor-instructions"]') as HTMLTextAreaElement;
const saveButton = () => screen.getByTestId("modal-button-create");

/** Renders the editor with a plain trigger, opens it, and waits for the full skill to load. */
async function openEditor(props: Partial<Parameters<typeof SkillEditor>[0]> = {}) {
  const onSuccess = vi.fn();
  const skill = props.skill;
  if (skill) {
    const full = { ...skill, instructions: "Write it well." } as SkillInterface;
    SkillService.findOne.mockResolvedValue(full);
    SkillService.findOneGlobal.mockResolvedValue(full);
  }
  render(
    <SkillEditor scope="company" onSuccess={onSuccess} trigger={<button type="button">open</button>} {...props} />,
  );
  await userEvent.click(screen.getByText("open"));
  if (skill) await waitFor(() => expect(instructionsInput().value).toBe("Write it well."));
  return { onSuccess };
}

const isOpen = () => screen.queryByTestId("skill-editor-name") !== null;

describe("SkillEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("new skill: create title, empty editable fields, On switch on, no notice, no Delete or Restore", async () => {
    await openEditor();

    expect(screen.getByText("skill.editor.create")).toBeInTheDocument();
    expect(nameInput().value).toBe("");
    expect(nameInput()).not.toBeDisabled();
    expect(descriptionInput().value).toBe("");
    expect(instructionsInput().value).toBe("");
    expect(instructionsInput()).not.toBeDisabled();
    expect(within(screen.getByTestId("skill-editor-active")).getByRole("switch")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.queryByTestId("skill-editor-notice")).toBeNull();
    expect(screen.queryByTestId("skill-delete-button")).toBeNull();
    expect(screen.queryByTestId("skill-restore-button")).toBeNull();
    expect(SkillService.findOne).not.toHaveBeenCalled();
  });

  it("new skill: Save calls create with the typed values", async () => {
    SkillService.create.mockResolvedValue(makeSkill());
    const { onSuccess } = await openEditor();

    fireEvent.change(nameInput(), { target: { value: "quote" } });
    fireEvent.change(descriptionInput(), { target: { value: "How we write quotes" } });
    fireEvent.change(instructionsInput(), { target: { value: "Be precise." } });
    await userEvent.click(saveButton());

    await waitFor(() => expect(SkillService.create).toHaveBeenCalled());
    expect(SkillService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "quote",
        description: "How we write quotes",
        instructions: "Be precise.",
        isActive: true,
      }),
    );
    expect(SkillService.create.mock.calls[0][0].originalId).toBeUndefined();
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it("own skill: name editable, Delete present, Save calls update", async () => {
    SkillService.update.mockResolvedValue(makeSkill());
    const skill = makeSkill();
    await openEditor({ skill });

    expect(SkillService.findOne).toHaveBeenCalledWith({ id: skill.id });
    expect(screen.getByText("skill.editor.edit")).toBeInTheDocument();
    expect(nameInput()).not.toBeDisabled();
    expect(screen.getByTestId("skill-delete-button")).toBeInTheDocument();
    expect(screen.queryByTestId("skill-restore-button")).toBeNull();

    fireEvent.change(descriptionInput(), { target: { value: "New description" } });
    await userEvent.click(saveButton());

    await waitFor(() =>
      expect(SkillService.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: skill.id, name: "quote", description: "New description" }),
      ),
    );
  });

  it("copy: copy notice, name read-only, Restore present without Delete; confirming Restore deletes the copy", async () => {
    SkillService.delete.mockResolvedValue(undefined);
    const skill = makeSkill({ origin: "copy", canRestore: true });
    const { onSuccess } = await openEditor({ skill });

    expect(screen.getByTestId("skill-editor-notice")).toHaveTextContent("skill.notice.copy");
    expect(nameInput()).toBeDisabled();
    expect(screen.getByTestId("skill-editor-active")).toBeInTheDocument();
    expect(screen.queryByTestId("skill-delete-button")).toBeNull();

    await userEvent.click(screen.getByTestId("skill-restore-button"));
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("skill.restore.confirm");
    await userEvent.click(within(dialog).getByRole("button", { name: "skill.buttons.restore" }));

    await waitFor(() => expect(SkillService.delete).toHaveBeenCalledWith({ id: skill.id }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    await waitFor(() => expect(isOpen()).toBe(false));
  });

  it("copy: Save sends the copy's own name, which the update body requires", async () => {
    SkillService.update.mockResolvedValue(makeSkill({ origin: "copy" }));
    const skill = makeSkill({ origin: "copy", canRestore: true, name: "brief" });
    await openEditor({ skill });

    fireEvent.change(descriptionInput(), { target: { value: "Our brief" } });
    await userEvent.click(saveButton());

    await waitFor(() => expect(SkillService.update).toHaveBeenCalled());
    expect(SkillService.update.mock.calls[0][0]).toEqual(
      expect.objectContaining({ id: skill.id, name: "brief", description: "Our brief" }),
    );
  });

  describe("on a picked company (companyId)", () => {
    it("new skill: create goes to the picked company", async () => {
      SkillService.create.mockResolvedValue(makeSkill());
      await openEditor({ companyId: "c1" });

      fireEvent.change(nameInput(), { target: { value: "quote" } });
      fireEvent.change(descriptionInput(), { target: { value: "How we write quotes" } });
      fireEvent.change(instructionsInput(), { target: { value: "Be precise." } });
      await userEvent.click(saveButton());

      await waitFor(() => expect(SkillService.create).toHaveBeenCalled());
      expect(SkillService.create.mock.calls[0][1]).toEqual({ companyId: "c1" });
    });

    it("own skill: read and update go to the picked company", async () => {
      SkillService.update.mockResolvedValue(makeSkill());
      const skill = makeSkill();
      await openEditor({ skill, companyId: "c1" });

      expect(SkillService.findOne).toHaveBeenCalledWith({ id: skill.id, companyId: "c1" });
      fireEvent.change(descriptionInput(), { target: { value: "New description" } });
      await userEvent.click(saveButton());

      await waitFor(() => expect(SkillService.update).toHaveBeenCalled());
      expect(SkillService.update.mock.calls[0][1]).toEqual({ companyId: "c1" });
    });

    it("untouched global: the copy is made in the picked company", async () => {
      const skill = makeSkill({ origin: "global", isGlobal: true });
      SkillService.create.mockResolvedValue(makeSkill({ origin: "copy" }));
      await openEditor({ skill, companyId: "c1" });

      fireEvent.change(descriptionInput(), { target: { value: "Ours" } });
      await userEvent.click(saveButton());

      await waitFor(() => expect(SkillService.create).toHaveBeenCalled());
      expect(SkillService.create.mock.calls[0][0]).toEqual(expect.objectContaining({ originalId: skill.id }));
      expect(SkillService.create.mock.calls[0][1]).toEqual({ companyId: "c1" });
    });

    it("copy: Restore original deletes the copy in the picked company", async () => {
      SkillService.delete.mockResolvedValue(undefined);
      const skill = makeSkill({ origin: "copy", canRestore: true });
      await openEditor({ skill, companyId: "c1" });

      await userEvent.click(screen.getByTestId("skill-restore-button"));
      const dialog = await screen.findByRole("alertdialog");
      await userEvent.click(within(dialog).getByRole("button", { name: "skill.buttons.restore" }));

      await waitFor(() => expect(SkillService.delete).toHaveBeenCalledWith({ id: skill.id, companyId: "c1" }));
    });
  });

  it("keeps description and instructions exactly as typed, surrounding whitespace included", async () => {
    SkillService.create.mockResolvedValue(makeSkill());
    await openEditor();

    fireEvent.change(nameInput(), { target: { value: "quote" } });
    fireEvent.change(descriptionInput(), { target: { value: "  How we quote  " } });
    fireEvent.change(instructionsInput(), { target: { value: "\n  - Be precise.\n\n" } });
    await userEvent.click(saveButton());

    await waitFor(() => expect(SkillService.create).toHaveBeenCalled());
    expect(SkillService.create.mock.calls[0][0]).toEqual(
      expect.objectContaining({ description: "  How we quote  ", instructions: "\n  - Be precise.\n\n" }),
    );
  });

  it("whitespace-only description and instructions count as empty", async () => {
    await openEditor();

    fireEvent.change(nameInput(), { target: { value: "quote" } });
    fireEvent.change(descriptionInput(), { target: { value: "   " } });
    fireEvent.change(instructionsInput(), { target: { value: " \n " } });
    await userEvent.click(saveButton());

    expect(await screen.findByText("skill.fields.description.error")).toBeInTheDocument();
    expect(screen.getByText("skill.fields.instructions.error")).toBeInTheDocument();
    expect(SkillService.create).not.toHaveBeenCalled();
  });

  it("copy whose original is off globally: no Restore button", async () => {
    await openEditor({ skill: makeSkill({ origin: "copy", canRestore: false }) });
    expect(screen.queryByTestId("skill-restore-button")).toBeNull();
    expect(screen.queryByTestId("skill-delete-button")).toBeNull();
  });

  it("untouched global: global notice, name read-only, no On switch; a changed Save makes a copy", async () => {
    const skill = makeSkill({ origin: "global", isGlobal: true });
    SkillService.create.mockResolvedValue(makeSkill({ origin: "copy" }));
    const { onSuccess } = await openEditor({ skill });

    expect(screen.getByTestId("skill-editor-notice")).toHaveTextContent("skill.notice.global");
    expect(nameInput()).toBeDisabled();
    expect(screen.queryByTestId("skill-editor-active")).toBeNull();
    expect(screen.queryByTestId("skill-delete-button")).toBeNull();
    expect(screen.queryByTestId("skill-restore-button")).toBeNull();

    fireEvent.change(descriptionInput(), { target: { value: "Our quotes" } });
    await userEvent.click(saveButton());

    await waitFor(() => expect(SkillService.create).toHaveBeenCalled());
    const input = SkillService.create.mock.calls[0][0];
    expect(input.id).not.toBe(skill.id);
    expect(input.originalId).toBe(skill.id);
    // The create body requires a name; the server replaces it with the original's.
    expect(input.name).toBe(skill.name);
    expect(input.description).toBe("Our quotes");
    expect(input.instructions).toBe("Write it well.");
    expect(SkillService.update).not.toHaveBeenCalled();
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it("untouched global: a change typed before the full skill arrives survives the load and makes a copy", async () => {
    const skill = makeSkill({ origin: "global", isGlobal: true });
    let resolveFull: (value: SkillInterface) => void = () => {};
    SkillService.findOne.mockReturnValue(new Promise<SkillInterface>((resolve) => (resolveFull = resolve)));
    SkillService.create.mockResolvedValue(makeSkill({ origin: "copy" }));
    render(<SkillEditor scope="company" skill={skill} trigger={<button type="button">open</button>} />);
    await userEvent.click(screen.getByText("open"));

    // The row already filled the description; the user edits it before the read answers.
    fireEvent.change(descriptionInput(), { target: { value: "Our quotes" } });
    resolveFull({ ...skill, instructions: "Write it well." } as SkillInterface);
    await waitFor(() => expect(instructionsInput().value).toBe("Write it well."));
    expect(descriptionInput().value).toBe("Our quotes");

    await userEvent.click(saveButton());
    await waitFor(() => expect(SkillService.create).toHaveBeenCalled());
    expect(SkillService.create.mock.calls[0][0]).toEqual(
      expect.objectContaining({ originalId: skill.id, description: "Our quotes", instructions: "Write it well." }),
    );
  });

  it("untouched global: Save with nothing changed calls nothing and closes", async () => {
    await openEditor({ skill: makeSkill({ origin: "global", isGlobal: true }) });

    await userEvent.click(saveButton());

    await waitFor(() => expect(isOpen()).toBe(false));
    expect(SkillService.create).not.toHaveBeenCalled();
    expect(SkillService.update).not.toHaveBeenCalled();
  });

  it("hidden global: hidden notice, every field read-only, no Save", async () => {
    await openEditor({ skill: makeSkill({ origin: "global", isGlobal: true, isHidden: true }) });

    expect(screen.getByTestId("skill-editor-notice")).toHaveTextContent("skill.hidden");
    expect(nameInput()).toBeDisabled();
    expect(descriptionInput()).toBeDisabled();
    expect(instructionsInput()).toBeDisabled();
    expect(screen.queryByTestId("skill-editor-active")).toBeNull();
    expect(screen.queryByTestId("modal-button-create")).toBeNull();
  });

  it("global scope, existing skill: name editable, Delete with the global confirm text, Save calls updateGlobal", async () => {
    SkillService.updateGlobal.mockResolvedValue(makeSkill({ isGlobal: true }));
    const skill = makeSkill({ isGlobal: true, origin: "global" });
    await openEditor({ scope: "global", skill });

    expect(SkillService.findOneGlobal).toHaveBeenCalledWith({ id: skill.id });
    expect(nameInput()).not.toBeDisabled();
    expect(screen.queryByTestId("skill-editor-notice")).toBeNull();
    expect(screen.getByTestId("skill-editor-active")).toBeInTheDocument();

    await userEvent.click(screen.getByTestId("skill-delete-button"));
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("skill.delete.global");
    await userEvent.click(within(dialog).getByRole("button", { name: "ui.buttons.cancel" }));

    fireEvent.change(nameInput(), { target: { value: "quotes" } });
    await userEvent.click(saveButton());
    await waitFor(() =>
      expect(SkillService.updateGlobal).toHaveBeenCalledWith(expect.objectContaining({ id: skill.id, name: "quotes" })),
    );
  });

  it("global scope, new skill: Save calls createGlobal", async () => {
    SkillService.createGlobal.mockResolvedValue(makeSkill({ isGlobal: true }));
    await openEditor({ scope: "global" });

    fireEvent.change(nameInput(), { target: { value: "quote" } });
    fireEvent.change(descriptionInput(), { target: { value: "How we write quotes" } });
    fireEvent.change(instructionsInput(), { target: { value: "Be precise." } });
    await userEvent.click(saveButton());

    await waitFor(() => expect(SkillService.createGlobal).toHaveBeenCalled());
    expect(SkillService.create).not.toHaveBeenCalled();
  });

  it("an invalid name shows the name error and sends nothing", async () => {
    await openEditor();

    fireEvent.change(nameInput(), { target: { value: "Quote" } });
    fireEvent.change(descriptionInput(), { target: { value: "How we write quotes" } });
    fireEvent.change(instructionsInput(), { target: { value: "Be precise." } });
    await userEvent.click(saveButton());

    expect(await screen.findByText("skill.fields.name.error")).toBeInTheDocument();
    expect(SkillService.create).not.toHaveBeenCalled();
  });

  it("too long description and instructions show their errors", async () => {
    await openEditor();

    fireEvent.change(nameInput(), { target: { value: "quote" } });
    fireEvent.change(descriptionInput(), { target: { value: "a".repeat(201) } });
    fireEvent.change(instructionsInput(), { target: { value: "a".repeat(20001) } });
    await userEvent.click(saveButton());

    expect(await screen.findByText("skill.fields.description.error")).toBeInTheDocument();
    expect(screen.getByText("skill.fields.instructions.error")).toBeInTheDocument();
    expect(SkillService.create).not.toHaveBeenCalled();
  });

  it("Administration: a 409 skill.name_taken shows the global wording under the name", async () => {
    SkillService.createGlobal.mockRejectedValue(httpError(409, "skill.name_taken"));
    await openEditor({ scope: "global" });

    fireEvent.change(nameInput(), { target: { value: "quote" } });
    fireEvent.change(descriptionInput(), { target: { value: "How we write quotes" } });
    fireEvent.change(instructionsInput(), { target: { value: "Be precise." } });
    await userEvent.click(saveButton());

    expect(await screen.findByText("skill.fields.name.used")).toBeInTheDocument();
    expect(screen.queryByText("skill.fields.name.taken")).toBeNull();
    expect(isOpen()).toBe(true);
  });

  it.each([
    [409, "skill.name_taken", "skill.fields.name.taken"],
    [409, "skill.name_global", "skill.fields.name.global"],
    [422, "skill.limit_reached", "skill.errors.limit"],
  ])("a %i %s refusal shows %s under the name and keeps the sheet open", async (status, code, text) => {
    SkillService.create.mockRejectedValue(httpError(status, code));
    const { onSuccess } = await openEditor();

    fireEvent.change(nameInput(), { target: { value: "quote" } });
    fireEvent.change(descriptionInput(), { target: { value: "How we write quotes" } });
    fireEvent.change(instructionsInput(), { target: { value: "Be precise." } });
    await userEvent.click(saveButton());

    expect(await screen.findByText(text)).toBeInTheDocument();
    expect(isOpen()).toBe(true);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(errorToast).not.toHaveBeenCalled();
  });

  it.each([
    [409, "skill.changed"],
    [404, "Not Found"],
  ])("a %i on Save shows skill.errors.changed, reloads the list and closes", async (status, message) => {
    SkillService.update.mockRejectedValue(httpError(status, message));
    const { onSuccess } = await openEditor({ skill: makeSkill() });

    fireEvent.change(descriptionInput(), { target: { value: "New description" } });
    await userEvent.click(saveButton());

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(errorToast).toHaveBeenCalledWith(expect.objectContaining({ title: "skill.errors.changed" }));
    await waitFor(() => expect(isOpen()).toBe(false));
  });

  it.each([
    [409, "skill.changed"],
    [404, "Not Found"],
  ])("a %i on Delete shows skill.errors.changed, reloads the list and closes", async (status, message) => {
    SkillService.delete.mockRejectedValue(httpError(status, message));
    const { onSuccess } = await openEditor({ skill: makeSkill() });

    await userEvent.click(screen.getByTestId("skill-delete-button"));
    const dialog = await screen.findByRole("alertdialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "ui.buttons.delete" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(errorToast).toHaveBeenCalledWith(expect.objectContaining({ title: "skill.errors.changed" }));
    await waitFor(() => expect(isOpen()).toBe(false));
  });

  it("a 409 on Restore shows skill.errors.changed, reloads the list and closes", async () => {
    SkillService.delete.mockRejectedValue(httpError(409, "skill.changed"));
    const { onSuccess } = await openEditor({ skill: makeSkill({ origin: "copy", canRestore: true }) });

    await userEvent.click(screen.getByTestId("skill-restore-button"));
    const dialog = await screen.findByRole("alertdialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "skill.buttons.restore" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(errorToast).toHaveBeenCalledWith(expect.objectContaining({ title: "skill.errors.changed" }));
    await waitFor(() => expect(isOpen()).toBe(false));
  });

  it("any other Delete failure shows skill.errors.switch and keeps the sheet open", async () => {
    SkillService.delete.mockRejectedValue(httpError(500, "boom"));
    const { onSuccess } = await openEditor({ skill: makeSkill() });

    await userEvent.click(screen.getByTestId("skill-delete-button"));
    const dialog = await screen.findByRole("alertdialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "ui.buttons.delete" }));

    await waitFor(() =>
      expect(errorToast).toHaveBeenCalledWith(expect.objectContaining({ title: "skill.errors.switch" })),
    );
    expect(errorToast).toHaveBeenCalledTimes(1);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(isOpen()).toBe(true);
  });

  it("any other Restore failure shows skill.errors.switch and keeps the sheet open", async () => {
    SkillService.delete.mockRejectedValue(httpError(500, "boom"));
    const { onSuccess } = await openEditor({ skill: makeSkill({ origin: "copy", canRestore: true }) });

    await userEvent.click(screen.getByTestId("skill-restore-button"));
    const dialog = await screen.findByRole("alertdialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "skill.buttons.restore" }));

    await waitFor(() =>
      expect(errorToast).toHaveBeenCalledWith(expect.objectContaining({ title: "skill.errors.switch" })),
    );
    expect(onSuccess).not.toHaveBeenCalled();
    expect(isOpen()).toBe(true);
  });

  it("description and instructions show live counters", async () => {
    await openEditor();

    fireEvent.change(descriptionInput(), { target: { value: "abc" } });
    fireEvent.change(instructionsInput(), { target: { value: "abcde" } });

    expect(screen.getByText(/skill\.counter:\{"count":3,"max":200\}/)).toBeInTheDocument();
    expect(screen.getByText(/skill\.counter:\{"count":5,"max":20000\}/)).toBeInTheDocument();
  });
});
