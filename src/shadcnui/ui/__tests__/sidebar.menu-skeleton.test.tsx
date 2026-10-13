import { render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SidebarMenuSkeleton } from "../sidebar";

function widths(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll<HTMLElement>('[data-sidebar="menu-skeleton-text"]')).map((el) =>
    el.style.getPropertyValue("--skeleton-width"),
  );
}

describe("SidebarMenuSkeleton", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("never calls Math.random, so it can sit inside a prerendered shell", () => {
    const random = vi.spyOn(Math, "random");
    render(<SidebarMenuSkeleton showIcon />);
    expect(random).not.toHaveBeenCalled();
  });

  it("gives every row a width between 50% and 89%", () => {
    const { container } = render(
      <>
        {Array.from({ length: 8 }, (_, index) => (
          <SidebarMenuSkeleton key={index} />
        ))}
      </>,
    );
    const values = widths(container);
    expect(values).toHaveLength(8);
    for (const value of values) {
      const percent = Number(value.replace("%", ""));
      expect(percent).toBeGreaterThanOrEqual(50);
      expect(percent).toBeLessThan(90);
    }
  });

  it("renders the same widths on every server render of the same tree, so hydration matches", () => {
    const tree = (
      <>
        <SidebarMenuSkeleton />
        <SidebarMenuSkeleton />
        <SidebarMenuSkeleton />
      </>
    );
    expect(renderToString(tree)).toEqual(renderToString(tree));
  });
});
