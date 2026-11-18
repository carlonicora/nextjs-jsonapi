import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { SkillInterface } from "../../../data/SkillInterface";
import { SkillSlashMenu } from "../SkillSlashMenu";

function skill(name: string): SkillInterface {
  return { id: `id-${name}`, name, description: `${name} description` } as unknown as SkillInterface;
}

const skills = [skill("email"), skill("embed"), skill("quote")];

describe("SkillSlashMenu", () => {
  it("renders the prefix matches with their name and description", () => {
    render(<SkillSlashMenu skills={skills} query="em" activeIndex={0} onPick={vi.fn()} />);
    const menu = screen.getByTestId("skill-menu");
    expect(menu).toHaveAttribute("role", "listbox");
    expect(screen.getByTestId("skill-menu-item-email")).toHaveTextContent("/email");
    expect(screen.getByTestId("skill-menu-item-email")).toHaveTextContent("email description");
    expect(screen.getByTestId("skill-menu-item-embed")).toBeInTheDocument();
    expect(screen.queryByTestId("skill-menu-item-quote")).not.toBeInTheDocument();
  });

  it("marks the active row aria-selected", () => {
    render(<SkillSlashMenu skills={skills} query="em" activeIndex={1} onPick={vi.fn()} />);
    expect(screen.getByTestId("skill-menu-item-email")).toHaveAttribute("aria-selected", "false");
    expect(screen.getByTestId("skill-menu-item-embed")).toHaveAttribute("aria-selected", "true");
  });

  it("calls onPick with the clicked skill", () => {
    const onPick = vi.fn();
    render(<SkillSlashMenu skills={skills} query="" activeIndex={0} onPick={onPick} />);
    fireEvent.mouseDown(screen.getByTestId("skill-menu-item-quote"));
    fireEvent.click(screen.getByTestId("skill-menu-item-quote"));
    expect(onPick).toHaveBeenCalledWith(skills[2]);
  });

  it("renders nothing with no match", () => {
    const { container } = render(<SkillSlashMenu skills={skills} query="zz" activeIndex={0} onPick={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
