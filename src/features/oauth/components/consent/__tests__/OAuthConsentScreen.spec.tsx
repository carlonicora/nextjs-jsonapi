import { render, renderHook, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UseOAuthConsentReturn } from "../../../hooks/useOAuthConsent";
import { OAuthConsentScreen } from "../OAuthConsentScreen";

const { hookState, getAuthorizationInfo, approveAuthorization, currentUserContext } = vi.hoisted(() => ({
  hookState: { value: null as UseOAuthConsentReturn | null },
  getAuthorizationInfo: vi.fn(),
  approveAuthorization: vi.fn(),
  currentUserContext: vi.fn(),
}));

// The screen tests drive a controllable hook; the hook tests (hookState.value = null) run the real one.
vi.mock("../../../hooks/useOAuthConsent", async () => {
  const actual = await vi.importActual<typeof import("../../../hooks/useOAuthConsent")>(
    "../../../hooks/useOAuthConsent",
  );
  return {
    ...actual,
    useOAuthConsent: (
      params: Parameters<typeof actual.useOAuthConsent>[0],
      options?: Parameters<typeof actual.useOAuthConsent>[1],
    ) => hookState.value ?? actual.useOAuthConsent(params, options),
  };
});

vi.mock("../../../data/oauth.service", () => ({
  OAuthService: {
    getAuthorizationInfo: (params: unknown) => getAuthorizationInfo(params),
    approveAuthorization: (params: unknown) => approveAuthorization(params),
    denyAuthorization: vi.fn(),
  },
}));

vi.mock("../../../../user/contexts/CurrentUserContext", () => ({
  useCurrentUserContextOptional: () => currentUserContext(),
  useCurrentUserContext: () => currentUserContext(),
}));

const PARAMS = { clientId: "client-1", redirectUri: "https://example.com/callback" };
const CLIENT = { id: "client-1", name: "Claude" } as any;
const C1 = { id: "c1", name: "A" };
const C2 = { id: "c2", name: "B" };

function makeHook(overrides: Partial<UseOAuthConsentReturn> = {}): UseOAuthConsentReturn {
  return {
    clientInfo: { client: CLIENT, scopes: [], companies: [C1] },
    isLoading: false,
    error: null,
    approve: vi.fn(),
    deny: vi.fn(),
    isSubmitting: false,
    companyId: "c1",
    setCompanyId: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  hookState.value = null;
  currentUserContext.mockReturnValue({ company: { id: "c2" } });
});

describe("OAuthConsentScreen", () => {
  it("renders no studio picker for a single company", () => {
    hookState.value = makeHook();
    render(<OAuthConsentScreen params={PARAMS} appName="Test" />);
    expect(screen.queryByLabelText("oauth.consent.company_label")).toBeNull();
  });

  it("renders the studio picker for two companies", () => {
    hookState.value = makeHook({
      clientInfo: { client: CLIENT, scopes: [], companies: [C1, C2] },
      companyId: "c2",
    });
    render(<OAuthConsentScreen params={PARAMS} appName="Test" />);
    expect(screen.getByLabelText("oauth.consent.company_label")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "oauth.consent.company_label" })).toBeInTheDocument();
  });

  it("renders translated keys, not hardcoded English", () => {
    hookState.value = makeHook();
    render(<OAuthConsentScreen params={PARAMS} appName="Test" />);
    expect(screen.getByText("oauth.consent.authorize")).toBeInTheDocument();
    expect(screen.queryByText("Authorize")).toBeNull();
  });
});

describe("useOAuthConsent", () => {
  const renderConsentHook = async (options?: { defaultCompanyId?: string }) => {
    const { useOAuthConsent } = await import("../../../hooks/useOAuthConsent");
    return renderHook(() => useOAuthConsent(PARAMS, options));
  };

  it("defaultCompanyId from the host app wins over the package user context", async () => {
    currentUserContext.mockReturnValue(undefined);
    getAuthorizationInfo.mockResolvedValue({ client: CLIENT, scopes: [], companies: [C1, C2] });
    const { result } = await renderConsentHook({ defaultCompanyId: "c2" });
    await waitFor(() => expect(result.current.companyId).toBe("c2"));
  });

  it("defaults companyId to the current web-session company when it is in the list", async () => {
    getAuthorizationInfo.mockResolvedValue({ client: CLIENT, scopes: [], companies: [C1, C2] });
    const { result } = await renderConsentHook();
    await waitFor(() => expect(result.current.companyId).toBe("c2"));
  });

  it("defaults to the first company when the current one is not in the list", async () => {
    currentUserContext.mockReturnValue({ company: { id: "c9" } });
    getAuthorizationInfo.mockResolvedValue({ client: CLIENT, scopes: [], companies: [C1, C2] });
    const { result } = await renderConsentHook();
    await waitFor(() => expect(result.current.companyId).toBe("c1"));
  });

  it("approve sends the selected company", async () => {
    getAuthorizationInfo.mockResolvedValue({ client: CLIENT, scopes: [], companies: [C1, C2] });
    approveAuthorization.mockResolvedValue({ redirectUrl: "" });
    const { result } = await renderConsentHook();
    await waitFor(() => expect(result.current.companyId).toBe("c2"));

    await result.current.approve();

    expect(approveAuthorization).toHaveBeenCalledWith(expect.objectContaining({ companyId: "c2" }));
  });
});
