import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ModuleRegistry } from "../../../../../../core/registry/ModuleRegistry";
import { configureI18n } from "../../../../../../i18n";
// Side-effect import: registers the "stripe-prices" table generator, which is
// what turns `StripePriceFields.actions` into a real column. Without it the
// registry has nothing to resolve and the table renders no columns at all.
import "../../../hooks/useStripePriceTableStructure";
import { PricesList } from "../PricesList";

// Hoisted so the vi.mock factories below (which run before the module body) can
// close over them. `retriever` is a mutable holder because the factory is
// evaluated at import time, long before beforeEach builds the fake retriever.
const mocks = vi.hoisted(() => ({
  errorToast: vi.fn(),
  refresh: vi.fn(),
  retriever: { current: null as any },
}));

// Only the two members PricesList takes from the barrel. Mocking it (rather
// than spreading the real one) keeps every feature barrel out of this suite;
// ContentListTable itself is the REAL component, because the assertions are
// about the columns it renders.
vi.mock("../../../../../../components", async () => {
  const actual = await vi.importActual<typeof import("../../../../../../components/tables/ContentListTable")>(
    "../../../../../../components/tables/ContentListTable",
  );
  return { ContentListTable: actual.ContentListTable, errorToast: mocks.errorToast };
});

// `useTableGenerator` stays REAL (the actions column is what is under test);
// only the network-backed list retriever is replaced.
vi.mock("../../../../../../hooks", async () => {
  const actual = await vi.importActual<any>("../../../../../../hooks");
  return { ...actual, useDataListRetriever: () => mocks.retriever.current };
});

vi.mock("../../../../contexts/PriceContext", () => ({
  usePriceContext: () => ({ priceVersion: 0 }),
}));

// The real editor mounts a whole EditorSheet + form; here it only has to report
// WHICH editor was rendered and with what seed.
vi.mock("../../forms/PriceEditor", () => ({
  default: (props: any) =>
    props.seed ? (
      <div
        data-testid="seeded-editor"
        data-seed={JSON.stringify(props.seed)}
        data-dialog-open={String(!!props.dialogOpen)}
      />
    ) : (
      <div data-testid="create-editor" data-has-on-success={String(typeof props.onSuccess === "function")} />
    ),
}));

const makePrice = (overrides: Record<string, any> = {}) => ({
  id: "price-1",
  // Stripe identity: must NEVER reach an exported document.
  stripePriceId: "price_1NabcXYZ",
  nickname: "Standard",
  unitAmount: 2900,
  currency: "usd",
  priceType: "recurring",
  recurring: { interval: "month", intervalCount: 1, usageType: "licensed" },
  token: 100,
  isTrial: false,
  active: true,
  description: "The standard plan",
  features: ["Everything in Basic"],
  priceFeatures: [{ id: "feature-ai", name: "AI Assistant" }],
  ...overrides,
});

const prices = [makePrice(), makePrice({ id: "price-2", stripePriceId: "price_2DefGHI", nickname: "Pro" })];

const makeRetriever = (data: any[]) =>
  ({
    data,
    isLoaded: true,
    ready: true,
    next: undefined,
    previous: undefined,
    pageInfo: { startItem: 1, endItem: data.length },
    total: data.length,
    refresh: mocks.refresh,
    addAdditionalParameter: vi.fn(),
    removeAdditionalParameter: vi.fn(),
    setRefreshedElement: vi.fn(),
    removeElement: vi.fn(),
    search: vi.fn(),
    setReady: vi.fn(),
    isSearch: false,
  }) as any;

/** The hidden import input is driven by a ref, so it is queried, not clicked. */
const importInput = () => document.querySelector<HTMLInputElement>('input[type="file"]')!;

const cloneButtons = () => screen.queryAllByLabelText("billing.admin.prices.actions.clone");
const exportButtons = () => screen.queryAllByLabelText("billing.admin.prices.actions.export");

const anchorClicks: { href: string; download: string }[] = [];

// `Modules.StripePrice` resolves through the registry at render time, and the
// nickname column builds a URL from it.
beforeAll(() => {
  ModuleRegistry.register("StripePrice", {
    name: "stripe-prices",
    pageUrl: "/administration/prices",
  } as any);
});

beforeEach(() => {
  vi.clearAllMocks();
  anchorClicks.length = 0;
  mocks.retriever.current = makeRetriever(prices);

  (URL as any).createObjectURL = vi.fn(() => "blob:price-export");
  (URL as any).revokeObjectURL = vi.fn();
  // jsdom does not navigate, so a real anchor click only logs "Not
  // implemented". Spying records the href/download the download path produced.
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    anchorClicks.push({ href: this.href, download: this.download });
  });

  configureI18n({
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    }),
    useTranslations: () => (key: string) => key,
    Link: ({ children }: any) => children,
    usePathname: () => "/",
  });
});

describe("PricesList — actions column", () => {
  it("renders a clone and an export button for every row", () => {
    render(<PricesList productId="product-1" />);

    expect(cloneButtons()).toHaveLength(prices.length);
    expect(exportButtons()).toHaveLength(prices.length);
  });

  it("opens a seeded editor when a row is cloned", async () => {
    render(<PricesList productId="product-1" />);
    expect(screen.queryByTestId("seeded-editor")).not.toBeInTheDocument();

    fireEvent.click(cloneButtons()[1]);

    const editor = await screen.findByTestId("seeded-editor");
    const seed = JSON.parse(editor.getAttribute("data-seed")!);
    expect(seed.nickname).toBe("Pro");
    // MINOR units survive the clone, identity does not.
    expect(seed.unitAmount).toBe(2900);
    expect(seed).not.toHaveProperty("stripePriceId");
    expect(editor.getAttribute("data-dialog-open")).toBe("true");
  });
});

describe("PricesList — export", () => {
  it("downloads a JSON document that carries no Stripe identity", async () => {
    render(<PricesList productId="product-1" />);

    fireEvent.click(exportButtons()[0]);

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    const blob = (URL.createObjectURL as any).mock.calls[0][0] as Blob;
    expect(blob.type).toBe("application/json");

    const text = await blob.text();
    expect(text).not.toContain("stripePriceId");
    expect(text).not.toContain("price_1NabcXYZ");
    expect(JSON.parse(text)).toMatchObject({
      kind: "stripe-price",
      version: 1,
      price: { unitAmount: 2900, currency: "usd", interval: "month", nickname: "Standard" },
    });

    expect(anchorClicks).toEqual([{ href: "blob:price-export", download: "price-standard.json" }]);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:price-export");
  });

  it("exports without touching the API", () => {
    render(<PricesList productId="product-1" />);

    fireEvent.click(exportButtons()[0]);

    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});

describe("PricesList — import", () => {
  const upload = (contents: string, name = "price.json") => {
    const file = new File([contents], name, { type: "application/json" });
    fireEvent.change(importInput(), { target: { files: [file] } });
  };

  it("opens the seeded editor from a valid transfer document", async () => {
    render(<PricesList productId="product-1" />);

    upload(
      JSON.stringify({
        kind: "stripe-price",
        version: 1,
        price: { unitAmount: 9900, currency: "eur", interval: "year", nickname: "Imported" },
      }),
    );

    const editor = await screen.findByTestId("seeded-editor");
    expect(JSON.parse(editor.getAttribute("data-seed")!)).toMatchObject({
      unitAmount: 9900,
      currency: "eur",
      interval: "year",
      nickname: "Imported",
    });
    expect(mocks.errorToast).not.toHaveBeenCalled();
  });

  it("resets the input so the same file can be picked twice", async () => {
    render(<PricesList productId="product-1" />);

    upload(
      JSON.stringify({
        kind: "stripe-price",
        version: 1,
        price: { unitAmount: 100, currency: "usd", interval: "month" },
      }),
    );

    await screen.findByTestId("seeded-editor");
    expect(importInput().value).toBe("");
  });

  it("toasts and opens nothing when the file is garbage", async () => {
    render(<PricesList productId="product-1" />);

    upload("this is not json at all");

    await waitFor(() => expect(mocks.errorToast).toHaveBeenCalledTimes(1));
    expect(mocks.errorToast.mock.calls[0][0].title).toBe("billing.admin.prices.import.errors.title");
    // The parser's messages are hardcoded English, so the toast carries the
    // translated line instead and the raw error only reaches the console.
    expect(mocks.errorToast.mock.calls[0][0].error).toBe("billing.admin.prices.import.errors.invalid");
    expect(screen.queryByTestId("seeded-editor")).not.toBeInTheDocument();
  });

  it("toasts and opens nothing when the JSON is not a price transfer document", async () => {
    render(<PricesList productId="product-1" />);

    upload(JSON.stringify({ kind: "something-else", version: 1, price: {} }));

    await waitFor(() => expect(mocks.errorToast).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId("seeded-editor")).not.toBeInTheDocument();
  });
});

describe("PricesList — create", () => {
  it("gives the create editor an onSuccess, which is what suppresses the navigation", () => {
    render(<PricesList productId="product-1" />);

    expect(screen.getByTestId("create-editor")).toHaveAttribute("data-has-on-success", "true");
  });
});
