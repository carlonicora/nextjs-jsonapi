import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { CurrencyInput } from "../CurrencyInput";

describe("CurrencyInput", () => {
  it("displays the value with a dot by default", () => {
    render(<CurrencyInput valueCents={60050} onChange={vi.fn()} />);
    expect(screen.getByRole("textbox")).toHaveValue("600.50");
  });

  it("displays the value with a comma when decimalSeparator is ','", () => {
    render(<CurrencyInput valueCents={60050} onChange={vi.fn()} decimalSeparator="," />);
    expect(screen.getByRole("textbox")).toHaveValue("600,50");
  });

  it("commits cents on blur from a comma-decimal value", () => {
    const onChange = vi.fn();
    render(<CurrencyInput valueCents={0} onChange={onChange} decimalSeparator="," />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "1234,5" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(123450);
  });

  it("reads a dot grouped in threes as thousands when decimalSeparator is ','", () => {
    const onChange = vi.fn();
    render(<CurrencyInput valueCents={0} onChange={onChange} decimalSeparator="," />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "1.000" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(100000);
  });

  it("keeps reading a dot as the decimal separator by default", () => {
    const onChange = vi.fn();
    render(<CurrencyInput valueCents={0} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "1.000" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(100);
  });

  it("reads thousands grouping with a comma decimal when decimalSeparator is ','", () => {
    const onChange = vi.fn();
    render(<CurrencyInput valueCents={0} onChange={onChange} decimalSeparator="," />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "1.234,5" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(123450);
  });

  it("still accepts a dot as the decimal separator when decimalSeparator is ','", () => {
    const onChange = vi.fn();
    render(<CurrencyInput valueCents={0} onChange={onChange} decimalSeparator="," />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "600.5" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(60050);
  });
});
