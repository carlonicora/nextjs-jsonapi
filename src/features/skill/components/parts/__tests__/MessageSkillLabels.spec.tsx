import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MessageSkillLabels } from "../MessageSkillLabels";

describe("MessageSkillLabels", () => {
  it("renders one badge per skill name, in order", () => {
    render(<MessageSkillLabels names={["email", "humanizer"]} />);
    const row = screen.getByTestId("message-skill-labels");
    const badges = Array.from(row.children);
    expect(badges).toHaveLength(2);
    expect(badges[0]).toHaveAttribute("data-testid", "message-skill-label-email");
    expect(badges[1]).toHaveAttribute("data-testid", "message-skill-label-humanizer");
    expect(badges[0]).toHaveTextContent("email");
    expect(badges[1]).toHaveTextContent("humanizer");
    expect(badges[0]?.getAttribute("data-slot")).toBe("badge");
  });

  it("renders nothing with no names", () => {
    const { container } = render(<MessageSkillLabels names={[]} />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId("message-skill-labels")).not.toBeInTheDocument();
  });
});
