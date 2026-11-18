import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SkillInterface } from "../../../data/SkillInterface";
import { SkillSwitchCell } from "../SkillSwitchCell";

const { SkillService, errorToast } = vi.hoisted(() => ({
  SkillService: {
    enable: vi.fn(),
    disable: vi.fn(),
    enableGlobal: vi.fn(),
    disableGlobal: vi.fn(),
  },
  errorToast: vi.fn(),
}));

vi.mock("../../../data/SkillService", () => ({ SkillService }));
vi.mock("../../../../../components/errors/errorToast", () => ({ errorToast }));

function makeSkill(overrides: Partial<Record<keyof SkillInterface, unknown>> = {}): SkillInterface {
  return {
    id: "skill-1",
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

const switchOf = (name = "quote") => screen.getByTestId(`skill-switch-${name}`);

describe("SkillSwitchCell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("company scope, on: renders checked, a click calls disable, flips at once and hands back the saved skill", async () => {
    const saved = makeSkill({ isEnabled: false });
    let resolve: (value: SkillInterface) => void = () => {};
    SkillService.disable.mockReturnValue(new Promise((r) => (resolve = r)));
    const onSaved = vi.fn();

    render(<SkillSwitchCell skill={makeSkill()} scope="company" onSaved={onSaved} />);
    expect(switchOf()).toHaveAttribute("aria-checked", "true");

    await userEvent.click(switchOf());
    expect(SkillService.disable).toHaveBeenCalledWith({ id: "skill-1" });
    expect(switchOf()).toHaveAttribute("aria-checked", "false");

    resolve(saved);
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(saved));
  });

  it("company scope, off: a click calls enable", async () => {
    SkillService.enable.mockResolvedValue(makeSkill());
    render(<SkillSwitchCell skill={makeSkill({ isEnabled: false })} scope="company" />);

    await userEvent.click(switchOf());
    expect(SkillService.enable).toHaveBeenCalledWith({ id: "skill-1" });
  });

  it("global scope: a click calls disableGlobal / enableGlobal", async () => {
    SkillService.disableGlobal.mockResolvedValue(makeSkill({ isEnabled: false }));
    SkillService.enableGlobal.mockResolvedValue(makeSkill());

    const { unmount } = render(<SkillSwitchCell skill={makeSkill()} scope="global" />);
    await userEvent.click(switchOf());
    expect(SkillService.disableGlobal).toHaveBeenCalledWith({ id: "skill-1" });
    unmount();

    render(<SkillSwitchCell skill={makeSkill({ isEnabled: false })} scope="global" />);
    await userEvent.click(switchOf());
    expect(SkillService.enableGlobal).toHaveBeenCalledWith({ id: "skill-1" });
    expect(SkillService.disable).not.toHaveBeenCalled();
    expect(SkillService.enable).not.toHaveBeenCalled();
  });

  it("a failed save flips the switch back and shows skill.errors.switch", async () => {
    SkillService.disable.mockRejectedValue(httpError(500, "boom"));
    const onSaved = vi.fn();
    const onChanged = vi.fn();
    render(<SkillSwitchCell skill={makeSkill()} scope="company" onSaved={onSaved} onChanged={onChanged} />);

    await userEvent.click(switchOf());
    await waitFor(() => expect(switchOf()).toHaveAttribute("aria-checked", "true"));
    expect(errorToast).toHaveBeenCalledWith(expect.objectContaining({ title: "skill.errors.switch" }));
    expect(onSaved).not.toHaveBeenCalled();
    expect(onChanged).not.toHaveBeenCalled();
  });

  it.each([
    [409, "skill.changed"],
    [404, "Not Found"],
  ])("a %i refusal flips back, shows skill.errors.changed and asks for a reload", async (status, message) => {
    SkillService.disable.mockRejectedValue(httpError(status, message));
    const onSaved = vi.fn();
    const onChanged = vi.fn();
    render(<SkillSwitchCell skill={makeSkill()} scope="company" onSaved={onSaved} onChanged={onChanged} />);

    await userEvent.click(switchOf());
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(switchOf()).toHaveAttribute("aria-checked", "true");
    expect(errorToast).toHaveBeenCalledWith(expect.objectContaining({ title: "skill.errors.changed" }));
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("a hidden skill shows the hidden text and no switch", () => {
    render(<SkillSwitchCell skill={makeSkill({ origin: "global", isHidden: true })} scope="company" />);
    expect(screen.queryByTestId("skill-switch-quote")).toBeNull();
    expect(screen.getByTestId("skill-hidden-quote")).toHaveTextContent("skill.hidden");
  });
});
