import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

const TEMPLATE_PATH = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "pwa", "offline.template.html");

const PLACEHOLDERS = [
  "{{APP_NAME}}",
  "/*{{THEME_CSS}}*/",
  "{{TITLE}}",
  "{{DESCRIPTION}}",
  "{{RETRY}}",
  "{{OFFLINE_CONFIG}}",
] as const;

type OfflineStrings = { title: string; description: string; retry: string };

type OfflineConfig = {
  defaultTheme: string;
  enableSystem: boolean;
  themes: string[];
  defaultLocale: string;
  locales: string[];
  rtl: string[];
  strings: Record<string, OfflineStrings>;
};

const STRINGS: Record<string, OfflineStrings> = {
  en: { title: "You're Offline", description: "Check your connection.", retry: "Try Again" },
  it: { title: "Sei offline", description: "Controlla la connessione.", retry: "Riprova" },
  ar: { title: "أنت غير متصل", description: "تحقق من اتصالك.", retry: "أعد المحاولة" },
};

function baseConfig(overrides: Partial<OfflineConfig> = {}): OfflineConfig {
  return {
    defaultTheme: "light",
    enableSystem: true,
    themes: ["dark", "cozy"],
    defaultLocale: "en",
    locales: ["en", "it", "ar"],
    rtl: ["ar"],
    strings: STRINGS,
    ...overrides,
  };
}

function readTemplate(): string {
  return readFileSync(TEMPLATE_PATH, "utf8");
}

function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

function fill(config: OfflineConfig): string {
  return readTemplate()
    .split("{{APP_NAME}}")
    .join("Test App")
    .split("/*{{THEME_CSS}}*/")
    .join(":root { --background: white; } .dark { --background: black; }")
    .split("{{TITLE}}")
    .join(STRINGS.en.title)
    .split("{{DESCRIPTION}}")
    .join(STRINGS.en.description)
    .split("{{RETRY}}")
    .join(STRINGS.en.retry)
    .split("{{OFFLINE_CONFIG}}")
    .join(JSON.stringify(config));
}

type Env = {
  stored?: string | null;
  storageThrows?: boolean;
  languages?: string[];
  pathname?: string;
  cookie?: string;
  prefersDark?: boolean;
};

type RunResult = {
  lang: string;
  dir: string;
  classes: string[];
  text: Record<"title" | "description" | "retry", string>;
};

function runScript(html: string, env: Env = {}): RunResult {
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  expect(scripts.length).toBe(1);
  const body = scripts[0][1];

  // Host-realm containers: the sandbox only writes primitives into them, so
  // assertions never compare arrays created inside the vm context.
  const classes: string[] = [];
  const elements: Record<"title" | "description" | "retry", { textContent: string }> = {
    title: { textContent: STRINGS.en.title },
    description: { textContent: STRINGS.en.description },
    retry: { textContent: STRINGS.en.retry },
  };
  const documentElement = {
    lang: "en",
    dir: "",
    className: "",
    classList: {
      add: (name: string) => {
        classes.push(String(name));
        documentElement.className = classes.join(" ");
      },
    },
  };

  const sandbox: Record<string, unknown> = {
    document: {
      documentElement,
      cookie: env.cookie ?? "",
      getElementById: (id: string) => elements[id as keyof typeof elements] ?? null,
    },
    localStorage: {
      getItem: (_key: string) => {
        if (env.storageThrows) throw new Error("SecurityError");
        return env.stored ?? null;
      },
    },
    navigator: { languages: env.languages ?? [] },
    location: { pathname: env.pathname ?? "/" },
    matchMedia: () => ({ matches: env.prefersDark ?? false }),
  };
  sandbox.window = sandbox;

  runInNewContext(body, sandbox);

  return {
    lang: String(documentElement.lang),
    dir: String(documentElement.dir),
    classes: classes.slice(),
    text: {
      title: String(elements.title.textContent),
      description: String(elements.description.textContent),
      retry: String(elements.retry.textContent),
    },
  };
}

describe("pwa/offline.template.html", () => {
  it("contains no /_next/ reference, external script, stylesheet or font", () => {
    const raw = readTemplate();
    expect(raw).not.toContain("/_next/");
    expect(raw).not.toMatch(/<script[^>]+src=/);
    expect(raw).not.toMatch(/<link[^>]+href=/);
    expect(raw).not.toContain("url(http");
    expect(raw).not.toContain("@import");
  });

  it("carries every placeholder exactly once", () => {
    const raw = readTemplate();
    for (const placeholder of PLACEHOLDERS) {
      expect(countOccurrences(raw, placeholder), placeholder).toBe(1);
    }
  });

  it("applies a stored theme as a class", () => {
    const result = runScript(fill(baseConfig()), { stored: "dark" });
    expect(result.classes).toContain("dark");
  });

  it("uses the default theme when nothing is stored", () => {
    const light = runScript(fill(baseConfig()), { stored: null });
    expect(light.classes.length).toBe(0);

    const cozy = runScript(fill(baseConfig({ defaultTheme: "cozy" })), { stored: null });
    expect(cozy.classes).toContain("cozy");
  });

  it("follows the OS only for a stored system value with enableSystem", () => {
    const followsOs = runScript(fill(baseConfig()), { stored: "system", prefersDark: true });
    expect(followsOs.classes).toContain("dark");

    const noSystem = runScript(fill(baseConfig({ enableSystem: false })), { stored: "system", prefersDark: true });
    expect(noSystem.classes.length).toBe(0);

    const noSystemCozy = runScript(fill(baseConfig({ enableSystem: false, defaultTheme: "cozy" })), {
      stored: "system",
      prefersDark: true,
    });
    expect(noSystemCozy.classes.join(" ")).toBe("cozy");
  });

  it("falls back to the default theme when localStorage throws", () => {
    const result = runScript(fill(baseConfig({ defaultTheme: "cozy" })), {
      storageThrows: true,
      pathname: "/it/sessions",
    });
    expect(result.classes.join(" ")).toBe("cozy");
    expect(result.lang).toBe("it");
  });

  it("picks the locale from the URL prefix first", () => {
    const result = runScript(fill(baseConfig()), {
      pathname: "/it/sessions",
      cookie: "NEXT_LOCALE=en",
      languages: ["en-US"],
    });
    expect(result.lang).toBe("it");
  });

  it("then from the NEXT_LOCALE cookie", () => {
    const result = runScript(fill(baseConfig()), {
      pathname: "/sessions",
      cookie: "NEXT_LOCALE=it",
      languages: ["en-US"],
    });
    expect(result.lang).toBe("it");
  });

  it("then from navigator.languages", () => {
    const result = runScript(fill(baseConfig()), { pathname: "/sessions", languages: ["it-IT", "en"] });
    expect(result.lang).toBe("it");
  });

  it("skips locales the app does not ship", () => {
    const result = runScript(fill(baseConfig()), {
      pathname: "/fr/x",
      cookie: "NEXT_LOCALE=de",
      languages: ["pt-BR"],
    });
    expect(result.lang).toBe("en");
  });

  it("sets dir=rtl for an RTL locale", () => {
    const arabic = runScript(fill(baseConfig()), { pathname: "/ar/x" });
    expect(arabic.lang).toBe("ar");
    expect(arabic.dir).toBe("rtl");

    const italian = runScript(fill(baseConfig()), { pathname: "/it/x" });
    expect(italian.dir).toBe("ltr");
  });

  it("replaces the three strings with the chosen locale's", () => {
    const result = runScript(fill(baseConfig()), { pathname: "/it/x" });
    expect(result.text.title).toBe(STRINGS.it.title);
    expect(result.text.description).toBe(STRINGS.it.description);
    expect(result.text.retry).toBe(STRINGS.it.retry);
  });
});
