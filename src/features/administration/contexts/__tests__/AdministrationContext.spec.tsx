import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useSharedContext } from "../../../../contexts/SharedContext";
import { AdministrationProvider } from "../AdministrationContext";

// next-intl is globally mocked in vitest.setup.ts with `t = (key) => key`, so a
// translated label renders as its own key.
const SharedProbe = () => {
  const { breadcrumbs, title } = useSharedContext();
  return (
    <>
      <span data-testid="breadcrumbs">{JSON.stringify(breadcrumbs)}</span>
      <span data-testid="title">{String(title.type)}</span>
    </>
  );
};

describe("AdministrationProvider", () => {
  it("publishes an empty breadcrumb and the administration title when no section is given", () => {
    render(
      <AdministrationProvider>
        <SharedProbe />
      </AdministrationProvider>,
    );

    expect(screen.getByTestId("breadcrumbs")).toHaveTextContent("[]");
    expect(screen.getByTestId("title")).toHaveTextContent("administration.title");
  });

  it("publishes the section as an unlinked breadcrumb and as the title", () => {
    render(
      <AdministrationProvider section="Calendars">
        <SharedProbe />
      </AdministrationProvider>,
    );

    expect(screen.getByTestId("breadcrumbs")).toHaveTextContent(JSON.stringify([{ name: "Calendars" }]));
    expect(screen.getByTestId("title")).toHaveTextContent("Calendars");
  });
});
