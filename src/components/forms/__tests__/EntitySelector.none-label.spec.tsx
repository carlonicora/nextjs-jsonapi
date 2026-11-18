import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import EntitySelector from "../EntitySelector";

type Company = { id: string; name: string };

function Harness(props: {
  noneLabel?: string;
  onChange: (entity?: Company) => void;
  retriever: () => Promise<Company[]>;
}) {
  // Starts empty and is then set, as the admin pickers do: a default value would come back on clear.
  const form = useForm<{ company?: Company }>({ defaultValues: { company: undefined } });
  useEffect(() => {
    form.setValue("company", { id: "c1", name: "Acme" });
  }, []);
  return (
    <EntitySelector<Company>
      id="company"
      form={form}
      module={{ name: "companies" }}
      retriever={props.retriever}
      placeholder="All companies"
      noneLabel={props.noneLabel}
      onChange={props.onChange}
    />
  );
}

describe("EntitySelector noneLabel", () => {
  it("lists the none entry first; picking it clears the selection", async () => {
    const onChange = vi.fn();
    const retriever = vi.fn().mockResolvedValue([{ id: "c1", name: "Acme" }]);
    render(<Harness noneLabel="All companies" onChange={onChange} retriever={retriever} />);

    await userEvent.click(await screen.findByRole("button", { name: /Acme/ }));
    await waitFor(() => expect(screen.getAllByRole("option").length).toBeGreaterThan(1));
    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveTextContent("All companies");

    await userEvent.click(options[0]);
    expect(onChange).toHaveBeenCalledWith(undefined);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /All companies/, hidden: true })).toBeInTheDocument(),
    );
  });

  it("without noneLabel the list holds only the entities", async () => {
    const retriever = vi.fn().mockResolvedValue([{ id: "c1", name: "Acme" }]);
    render(<Harness onChange={vi.fn()} retriever={retriever} />);

    await userEvent.click(await screen.findByRole("button", { name: /Acme/ }));
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(1));
    expect(screen.getByRole("option")).toHaveTextContent("Acme");
  });
});
