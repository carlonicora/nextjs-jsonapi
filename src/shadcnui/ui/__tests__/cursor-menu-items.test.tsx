// packages/nextjs-jsonapi/src/shadcnui/ui/__tests__/cursor-menu-items.test.tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { Command, CommandItem, CommandList } from "../command";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../select";

describe("cursor affordance — menu and listbox items", () => {
  it("DropdownMenuItem is a pointer, not cursor-default", () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Edit</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const item = screen.getByRole("menuitem");
    expect(item).toHaveClass("cursor-pointer");
    expect(item).not.toHaveClass("cursor-default");
  });

  it("SelectItem is a pointer, not cursor-default", () => {
    render(
      <Select defaultOpen>
        <SelectTrigger>Pick</SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Alpha</SelectItem>
        </SelectContent>
      </Select>,
    );
    const option = screen.getByRole("option");
    expect(option).toHaveClass("cursor-pointer");
    expect(option).not.toHaveClass("cursor-default");
  });

  it("CommandItem is a pointer, not cursor-default", () => {
    render(
      <Command>
        <CommandList>
          <CommandItem value="alpha">Alpha</CommandItem>
        </CommandList>
      </Command>,
    );
    const item = screen.getByRole("option");
    expect(item).toHaveClass("cursor-pointer");
    expect(item).not.toHaveClass("cursor-default");
  });

  it("no shadcnui primitive still ships a bare cursor-default class", async () => {
    // Guards the sites a render test cannot cheaply reach (context-menu's
    // right-click trigger, select's scroll arrows, submenu triggers,
    // checkbox/radio items) and stops the class returning via a shadcn resync.
    //
    // Reads the ui/ directory instead of a hardcoded file list so new
    // primitives are covered automatically. Only flags a BARE `cursor-default`
    // token — a variant-prefixed one like `data-disabled:cursor-default` (or a
    // future `disabled:cursor-default`) is a legitimate, intentional class
    // (see slider.tsx's Control) and must NOT be flagged.
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const dir = path.resolve(__dirname, "..");
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".tsx")).map((entry) => entry.name);

    expect(files.length).toBeGreaterThan(0);

    // Matches a bare `cursor-default` token: the character immediately before
    // it must NOT be `:` or `-` (which would mean it's part of a variant
    // prefix like `data-disabled:cursor-default`). Start-of-string,
    // whitespace, and quote characters preceding it all count as bare.
    const bareCursorDefault = /(?<![:-])cursor-default/;

    for (const file of files) {
      const source = await fs.readFile(path.join(dir, file), "utf8");
      expect(source, `${file} must not contain a bare cursor-default class`).not.toMatch(bareCursorDefault);
    }
  });

  it("bare-cursor-default regex catches an unprefixed token and ignores a variant-prefixed one", () => {
    const bareCursorDefault = /(?<![:-])cursor-default/;

    expect("flex cursor-default items-center").toMatch(bareCursorDefault);
    expect('"cursor-default"').toMatch(bareCursorDefault);
    expect("data-disabled:cursor-default").not.toMatch(bareCursorDefault);
    expect("disabled:cursor-default").not.toMatch(bareCursorDefault);
  });
});
