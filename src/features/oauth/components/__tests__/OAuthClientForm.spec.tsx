import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OAuthClientForm } from "../OAuthClientForm";
import { OAUTH_SCOPE_DISPLAY, OAuthClientInterface } from "../../interfaces/oauth.interface";

const scopeCheckbox = (name: string) => screen.getByRole("checkbox", { name: new RegExp(name) });

const makeClient = (allowedScopes: string[]): OAuthClientInterface =>
  ({
    name: "Existing app",
    description: undefined,
    redirectUris: ["https://example.com/callback"],
    allowedScopes,
    isConfidential: true,
  }) as unknown as OAuthClientInterface;

describe("OAuthClientForm", () => {
  it("renders only the scopes passed in availableScopes", () => {
    render(<OAuthClientForm onSubmit={vi.fn()} onCancel={vi.fn()} availableScopes={[OAUTH_SCOPE_DISPLAY.mcp]} />);

    expect(screen.getByText("MCP Server Access")).toBeTruthy();
    expect(screen.queryByText("Read Access")).toBeNull();
    expect(screen.queryByText("Write Access")).toBeNull();
  });

  it("preselects defaultScopes in create mode", () => {
    render(
      <OAuthClientForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        availableScopes={[OAUTH_SCOPE_DISPLAY.read, OAUTH_SCOPE_DISPLAY.mcp]}
        defaultScopes={["mcp"]}
      />,
    );

    expect(scopeCheckbox("MCP Server Access").getAttribute("aria-checked")).toBe("true");
    expect(scopeCheckbox("Read Access").getAttribute("aria-checked")).toBe("false");
  });

  it("uses client.allowedScopes instead of defaultScopes in edit mode", () => {
    render(
      <OAuthClientForm
        client={makeClient(["read"])}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        availableScopes={[OAUTH_SCOPE_DISPLAY.read, OAUTH_SCOPE_DISPLAY.mcp]}
        defaultScopes={["mcp"]}
      />,
    );

    expect(scopeCheckbox("Read Access").getAttribute("aria-checked")).toBe("true");
    expect(scopeCheckbox("MCP Server Access").getAttribute("aria-checked")).toBe("false");
  });

  it("offers the generic scope list by default, without Only35 scopes", () => {
    render(<OAuthClientForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByText("MCP Server Access")).toBeTruthy();
    expect(screen.getByText("Read Access")).toBeTruthy();
    expect(screen.queryByText("View Photographs")).toBeNull();
    expect(screen.queryByText("View Rolls")).toBeNull();
  });
});
