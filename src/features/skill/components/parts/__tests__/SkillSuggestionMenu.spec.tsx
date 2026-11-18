import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SkillSuggestionMenu, type SkillSuggestionItem } from "../SkillSuggestionMenu";

function item(name: string): SkillSuggestionItem {
  return {
    id: `id-${name}`,
    skillName: name,
    title: `/${name}`,
    subtext: `${name} description`,
    onItemClick: vi.fn(),
  };
}

describe("SkillSuggestionMenu", () => {
  it("renders one row per item inside a bn-suggestion-menu root", () => {
    const items = [item("email"), item("humanizer")];
    render(<SkillSuggestionMenu items={items} selectedIndex={1} loadingState="loaded" onItemClick={vi.fn()} />);
    const menu = screen.getByTestId("skill-menu");
    expect(menu).toHaveClass("bn-suggestion-menu");
    const email = screen.getByTestId("skill-menu-item-email");
    const humanizer = screen.getByTestId("skill-menu-item-humanizer");
    expect(email).toHaveTextContent("/email");
    expect(email).toHaveTextContent("email description");
    expect(humanizer).toHaveTextContent("/humanizer");
    expect(email).toHaveAttribute("aria-selected", "false");
    expect(humanizer).toHaveAttribute("aria-selected", "true");
  });

  it("calls onItemClick with the clicked item", () => {
    const items = [item("email"), item("humanizer")];
    const onItemClick = vi.fn();
    render(<SkillSuggestionMenu items={items} selectedIndex={0} loadingState="loaded" onItemClick={onItemClick} />);
    fireEvent.click(screen.getByTestId("skill-menu-item-humanizer"));
    expect(onItemClick).toHaveBeenCalledWith(items[1]);
  });

  it("renders nothing with no items", () => {
    const { container } = render(
      <SkillSuggestionMenu items={[]} selectedIndex={undefined} loadingState="loaded" onItemClick={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
