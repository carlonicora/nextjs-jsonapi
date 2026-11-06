import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";

describe("PopoverContent container", () => {
  it("portals the popup into the given container instead of <body>", async () => {
    const container = document.createElement("div");
    container.setAttribute("data-testid", "trap");
    document.body.appendChild(container);

    render(
      <Popover defaultOpen>
        <PopoverTrigger>open</PopoverTrigger>
        <PopoverContent container={container}>inside</PopoverContent>
      </Popover>,
    );

    const popup = await screen.findByText("inside");
    expect(container.contains(popup)).toBe(true);
    container.remove();
  });
});
