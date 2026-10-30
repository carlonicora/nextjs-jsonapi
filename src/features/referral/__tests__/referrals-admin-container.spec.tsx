import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiRequestDataTypeInterface } from "../../../core/interfaces/ApiRequestDataTypeInterface";
import { ModuleRegistry } from "../../../core/registry/ModuleRegistry";
import { ModuleFactory, ModuleWithPermissions } from "../../../permissions/types";

const mocks = vi.hoisted(() => ({
  getSummary: vi.fn(),
  getReferrers: vi.fn(),
  getReferrals: vi.fn(),
  showToast: vi.fn(),
  showError: vi.fn(),
}));

// Echoes the key, so an assertion names the message the user would read.
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("../data/ReferralAdminService", () => ({
  ReferralAdminService: {
    getSummary: mocks.getSummary,
    getReferrers: mocks.getReferrers,
    getReferrals: mocks.getReferrals,
  },
}));

vi.mock("../../../utils", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  showToast: mocks.showToast,
  showError: mocks.showError,
}));

// The real page chrome needs the whole app shell; the stand-in renders the
// title bar functions (the period buttons) and the body. The table stand-in
// runs the registered table generator so the cells under test render, without
// the TanStack and responsive machinery of the real ContentListTable.
vi.mock("../../../components", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../components")>();
  const { useSharedContext } = await import("../../../contexts/SharedContext");
  const { useTableGenerator } = await import("../../../hooks");

  const RoundPageContainer = ({ children, testId }: { children?: ReactNode; testId?: string }) => {
    const { title } = useSharedContext();
    return (
      <div data-testid={testId}>
        <div>{title.functions}</div>
        {children}
      </div>
    );
  };

  const ContentListTable = (props: any) => {
    const { data, columns } = useTableGenerator(props.tableGeneratorType, {
      data: props.data.data ?? [],
      fields: props.fields,
      context: props.context,
      dataRetriever: props.data,
    });
    const render = (def: unknown, ctx: unknown) => (typeof def === "function" ? def(ctx) : def);
    return (
      <div>
        <div>
          {props.titleActions}
          {props.title}
        </div>
        <table>
          <thead>
            <tr>
              {columns.map((column: any) => (
                <th key={column.id}>{render(column.header, {})}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row: any, index: number) => (
              <tr key={index}>
                {columns.map((column: any) => (
                  <td key={column.id}>
                    {render(column.cell, { row: { original: row, getValue: (key: string) => row[key] } })}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return { ...actual, RoundPageContainer, ContentListTable };
});

import { ReferralsAdminContainer } from "../components/containers/ReferralsAdminContainer";
import { referralAdminModules } from "../referral-admin.modules";

const moduleFactory: ModuleFactory = (params) =>
  ({ pageUrl: params.pageUrl, name: params.name, model: params.model }) as ModuleWithPermissions;

const registerIfAbsent = (key: string, module: ApiRequestDataTypeInterface) => {
  try {
    ModuleRegistry.get(key as any);
  } catch {
    ModuleRegistry.register(key, module);
  }
};

beforeAll(() => {
  for (const [key, module] of Object.entries(referralAdminModules(moduleFactory))) registerIfAbsent(key, module);
});

const summaryRow = (window: string, values: Record<string, number>) => ({
  id: window,
  window,
  visits: 0,
  invitesSent: 0,
  signups: 0,
  paying: 0,
  creditsGiven: 0,
  sharingCompanies: 0,
  eligibleCompanies: 0,
  ...values,
});

const referrer = (id: string, email: string) => ({
  id,
  name: `Name ${id}`,
  email,
  visits: 1,
  invitesSent: 2,
  signupsLink: 1,
  signupsDirect: 1,
  paying: 1,
  creditsEarned: 200,
  lastInviteAt: new Date("2026-10-27T10:00:00.000Z"),
});

const writeText = vi.fn();

describe("ReferralsAdminContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    writeText.mockResolvedValue(undefined);
    mocks.getSummary.mockImplementation(({ period }: { period: string }) =>
      Promise.resolve(
        period === "all"
          ? [summaryRow("current", { visits: 40 })]
          : [summaryRow("current", { visits: 12 }), summaryRow("previous", { visits: 6 })],
      ),
    );
    mocks.getReferrers.mockResolvedValue([referrer("c1", "a@x.test"), referrer("c2", "b@x.test")]);
    mocks.getReferrals.mockResolvedValue([]);
  });

  it("renders the tiles from the current window", async () => {
    render(<ReferralsAdminContainer />);

    await waitFor(() => expect(screen.getByTestId("referrals-tile-visits-value")).toHaveTextContent("12"));
    expect(mocks.getSummary).toHaveBeenCalledWith({ period: "30d" });
    expect(screen.getByTestId("referrals-tile-visits-change")).toBeInTheDocument();
  });

  it("switching period refetches", async () => {
    render(<ReferralsAdminContainer />);
    await waitFor(() => expect(screen.getByTestId("referrals-tile-visits-value")).toHaveTextContent("12"));

    await act(async () => fireEvent.click(screen.getByTestId("referrals-period-all")));

    await waitFor(() => expect(screen.getByTestId("referrals-tile-visits-value")).toHaveTextContent("40"));
    expect(mocks.getSummary).toHaveBeenCalledWith({ period: "all" });
    expect(screen.getByTestId("referrals-period-all")).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByTestId("referrals-tile-visits-change")).not.toBeInTheDocument();
  });

  it("copy all emails copies the shown referrers", async () => {
    render(<ReferralsAdminContainer />);
    await waitFor(() => expect(screen.getByTestId("referrals-copy-email-c2")).toBeInTheDocument());

    await act(async () => fireEvent.click(screen.getByTestId("referrals-copy-all-emails")));

    expect(writeText).toHaveBeenCalledWith("a@x.test, b@x.test");
    expect(mocks.showToast).toHaveBeenCalledWith("referral.admin.referrers.copied");
  });

  it("per-row copy copies one email", async () => {
    render(<ReferralsAdminContainer />);
    await waitFor(() => expect(screen.getByTestId("referrals-copy-email-c2")).toBeInTheDocument());

    await act(async () => fireEvent.click(screen.getByTestId("referrals-copy-email-c2")));

    expect(writeText).toHaveBeenCalledWith("b@x.test");
    expect(mocks.showToast).toHaveBeenCalledWith("referral.admin.referrers.copied");
  });

  it("a referral with no recorded source shows no source pill", async () => {
    mocks.getReferrals.mockResolvedValue([
      {
        id: "r1",
        name: "Old account",
        email: "old@x.test",
        referrerName: "Name c1",
        referrerEmail: "a@x.test",
        source: "",
        status: "pending",
        referredAt: new Date("2026-10-20T10:00:00.000Z"),
        completedAt: undefined,
        tokensAwarded: undefined,
      },
    ]);
    render(<ReferralsAdminContainer />);
    await waitFor(() => expect(screen.getByText("Old account")).toBeInTheDocument());

    expect(screen.queryByText("referral.admin.source.direct")).not.toBeInTheDocument();
    expect(screen.queryByText("referral.admin.source.link")).not.toBeInTheDocument();
  });

  it("a refused clipboard write shows an error", async () => {
    writeText.mockRejectedValue(new Error("denied"));
    render(<ReferralsAdminContainer />);
    await waitFor(() => expect(screen.getByTestId("referrals-copy-email-c1")).toBeInTheDocument());

    await act(async () => fireEvent.click(screen.getByTestId("referrals-copy-email-c1")));

    expect(mocks.showError).toHaveBeenCalled();
    expect(mocks.showToast).not.toHaveBeenCalled();
  });
});
