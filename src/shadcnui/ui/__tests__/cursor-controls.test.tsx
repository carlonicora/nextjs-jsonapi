// packages/nextjs-jsonapi/src/shadcnui/ui/__tests__/cursor-controls.test.tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { Button } from "../button";
import { Checkbox } from "../checkbox";
import { Label } from "../label";
import { RadioGroup, RadioGroupItem } from "../radio-group";
import { Slider } from "../slider";
import { Switch } from "../switch";

describe("cursor affordance — controls that do not render a <button>", () => {
  it("Button carries cursor-pointer in its own class string, so it survives render={<div/>}", () => {
    // 13 call sites use <Button render={<div/>} nativeButton={false} />, which
    // renders a div. A `button {cursor:pointer}` CSS rule cannot reach those,
    // so the affordance has to live in buttonVariants itself.
    render(<Button>Save</Button>);
    expect(screen.getByRole("button")).toHaveClass("cursor-pointer");
  });

  it("Checkbox renders a span (not a button) and carries cursor-pointer", () => {
    render(<Checkbox />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox.tagName).toBe("SPAN");
    expect(checkbox).toHaveClass("cursor-pointer");
  });

  it("Checkbox uses data-disabled: for its disabled variants, not disabled:", () => {
    // :disabled cannot match a <span>, so `disabled:cursor-not-allowed` and
    // `disabled:opacity-50` were dead classes — disabled checkboxes did not dim.
    render(<Checkbox />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveClass("data-disabled:cursor-not-allowed");
    expect(checkbox).toHaveClass("data-disabled:opacity-50");
    expect(checkbox.className).not.toMatch(/(^|\s)disabled:/);
  });

  it("Switch renders a span (not a button) and carries cursor-pointer", () => {
    render(<Switch />);
    const toggle = screen.getByRole("switch");
    expect(toggle.tagName).toBe("SPAN");
    expect(toggle).toHaveClass("cursor-pointer");
    expect(toggle).toHaveClass("data-disabled:cursor-not-allowed");
  });

  it("RadioGroupItem renders a span (not a button) and carries cursor-pointer", () => {
    render(
      <RadioGroup>
        <RadioGroupItem value="one" />
      </RadioGroup>,
    );
    const radio = screen.getByRole("radio");
    expect(radio.tagName).toBe("SPAN");
    expect(radio).toHaveClass("cursor-pointer");
    expect(radio).toHaveClass("data-disabled:cursor-not-allowed");
    expect(radio.className).not.toMatch(/(^|\s)disabled:/);
  });

  it("Slider Control is click-to-set, so it carries cursor-pointer", () => {
    const { container } = render(<Slider defaultValue={[50]} />);
    const control = container.querySelector('[data-slot="slider-control"]');
    expect(control).not.toBeNull();
    expect(control).toHaveClass("cursor-pointer");
  });

  it("Slider Thumb carries grab cursors", () => {
    const { container } = render(<Slider defaultValue={[50]} />);
    const thumb = container.querySelector('[data-slot="slider-thumb"]');
    expect(thumb).not.toBeNull();
    expect(thumb).toHaveClass("cursor-grab");
    expect(thumb).toHaveClass("active:cursor-grabbing");
  });

  it("Button uses data-disabled: for its disabled cursor/pointer-events variants", () => {
    // A disabled <Button render={<div/>} nativeButton={false}> is a div, so
    // `disabled:pointer-events-none` never matched it — the div stayed
    // hoverable and pointer-cursored while visually disabled. `data-disabled:`
    // is set by Base UI's state-attribute mapping regardless of render mode.
    render(<Button disabled>Save</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("data-disabled:cursor-not-allowed");
    expect(button).toHaveClass("data-disabled:pointer-events-none");
  });

  it("disabled Checkbox renders with the data-disabled attribute present", () => {
    // Proves the selector `data-disabled:` (not `disabled:`) is the one that
    // can actually match — the Checkbox is a <span>, which never satisfies
    // the `:disabled` CSS pseudo-class.
    render(<Checkbox disabled />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox.tagName).toBe("SPAN");
    expect(checkbox).toHaveAttribute("data-disabled");
  });

  it("Slider Thumb carries data-disabled:cursor-not-allowed and no bare disabled: variant", () => {
    const { container } = render(<Slider defaultValue={[50]} disabled />);
    const thumb = container.querySelector('[data-slot="slider-thumb"]');
    expect(thumb).not.toBeNull();
    expect(thumb).toHaveClass("data-disabled:cursor-not-allowed");
    expect(thumb?.className).not.toMatch(/(^|\s)disabled:/);
  });

  it("Label carries peer-data-disabled:cursor-not-allowed and no bare peer-disabled: variant", () => {
    render(<Label>Accept terms</Label>);
    const label = screen.getByText("Accept terms");
    expect(label).toHaveClass("peer-data-disabled:cursor-not-allowed");
    expect(label.className).not.toMatch(/(^|\s)peer-disabled:/);
  });
});
