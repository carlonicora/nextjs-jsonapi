import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OAuthConsentHeader } from "../OAuthConsentHeader";

const CLIENT = { id: "client-1", name: "Claude" } as any;

describe("OAuthConsentHeader", () => {
  it("renders the consent title through ContentTitle (page-title recipe), not a raw <h1>", () => {
    const { container } = render(<OAuthConsentHeader client={CLIENT} appName="Test" />);

    expect(container.querySelector("h1")).toBeNull();
    const title = screen.getByText("oauth.consent.title");
    expect(title.className).toContain("text-primary text-3xl font-semibold");
  });

  it("keeps the title centred with no extra bottom margin", () => {
    const { container } = render(<OAuthConsentHeader client={CLIENT} appName="Test" />);

    const wrapper = screen.getByText("oauth.consent.title").parentElement?.parentElement as HTMLElement;
    expect(wrapper.className).toContain("justify-center");
    expect(wrapper.className).toContain("mb-0");
    expect(wrapper.className).not.toContain("mb-4");
    expect(container.firstElementChild?.className).toContain("text-center");
  });
});
