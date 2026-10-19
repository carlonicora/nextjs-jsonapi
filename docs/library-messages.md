# Library messages

From 5.1.0 the library ships the texts its own components render. An app merges them
under its own message file instead of copying them.

## 1. The files

- `messages/en.json` and `messages/it.json`, at the package root beside `pwa/`.
- In `files` and exposed as `exports["./messages/*"]`, so they resolve from the
  workspace submodule and from npm alike:
  `@carlonicora/nextjs-jsonapi/messages/en.json`.
- They hold every key the library's `src` resolves, nested exactly as the apps nest
  them. Keys are never renamed or moved: an app that wants a different text overrides
  the key in its own file.
- `it.json` has exactly the key paths of `en.json`. A library change that adds an
  English key adds its Italian in the same change, or `lint` fails.
- The files are committed sources. Nothing generates them at build time.
- They hold no app name, no app product copy, no app entity (section 4).

## 2. Merging them in the app

`mergeMessages(base, override)` from `@carlonicora/nextjs-jsonapi/core` deep-merges
plain objects: the override's leaf wins, a path only in the base stays, a path only in
the override is added, arrays and strings replace. Neither input is mutated.

The only app file that changes at runtime is `apps/web/src/i18n/request.ts`. Static
imports only: no `import(\`…/${locale}.json\`)` (the Turbopack HMR reason in every
app's `request.ts`). `getRequestConfig` keeps returning `MESSAGES[locale]`.

### en + it

```ts
import libraryEn from "@carlonicora/nextjs-jsonapi/messages/en.json";
import libraryIt from "@carlonicora/nextjs-jsonapi/messages/it.json";
import { mergeMessages } from "@carlonicora/nextjs-jsonapi/core";
import en from "../../messages/en.json";
import it from "../../messages/it.json";

const MESSAGES = {
  en: mergeMessages(libraryEn, en),
  it: mergeMessages(libraryIt, it),
} satisfies Record<(typeof routing.locales)[number], unknown>;
```

### Single locale

Import only the library file for that locale.

```ts
import libraryEn from "@carlonicora/nextjs-jsonapi/messages/en.json";
import { mergeMessages } from "@carlonicora/nextjs-jsonapi/core";
import en from "../../messages/en.json";

const MESSAGES = {
  en: mergeMessages(libraryEn, en),
} satisfies Record<(typeof routing.locales)[number], unknown>;
```

An Italian-only app does the same with `libraryIt` and `it`.

### Locales the library does not ship

A locale with no library file merges the library's English under the app file.

```ts
import libraryEn from "@carlonicora/nextjs-jsonapi/messages/en.json";
import libraryIt from "@carlonicora/nextjs-jsonapi/messages/it.json";
import { mergeMessages } from "@carlonicora/nextjs-jsonapi/core";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";
import it from "../../messages/it.json";

const MESSAGES = {
  ar: mergeMessages(libraryEn, ar),
  en: mergeMessages(libraryEn, en),
  it: mergeMessages(libraryIt, it),
} satisfies Record<(typeof routing.locales)[number], unknown>;
```

## 3. The app validator rule

In the app's `apps/web/scripts/validate-translations.mjs`, a key is present for a
locale when it resolves to a leaf in any of, in this order:

1. the app's `messages/<locale>.json`;
2. the library's `messages/<locale>.json`, when the library ships that locale;
3. the library's `messages/en.json`.

This applies to keys found in the app's source and to keys found under `packages/`
alike. Nothing else in the script changes. Read the library files with `fs` from the
path `createRequire(import.meta.url).resolve("@carlonicora/nextjs-jsonapi/messages/en.json")`
returns, so the rule works from the submodule and from npm.

Keys on the app-provided list (section 4) get no library fallback: the app must have
them.

## 4. App-provided keys

Owner decision, 2026-10-19:

> "The library should hold NO information about the application. NONE."

Some keys the library renders carry the app's own name or product copy. They are not
in the library files; every app provides them, with no library fallback.

The source of truth is `APP_PROVIDED_KEYS` in `scripts/validate-messages.mjs`. Each
entry is a pattern with a one-line reason. The initial entries:

- `common.title`, `common.description`;
- `auth.login_description`, `auth.register_description`;
- `features.assistant.composer_placeholder`, `features.assistant.starters.*`;
- every `entities.*` key except the library's own entities (`entities.assistants`,
  `entities.companies`, `entities.howtos`, `entities.rbac`, `entities.users`, …).
  `entities.campaigns` and `entities.npcs` appear as literals in library source but
  are app words, so they are app-provided.

The list grows only when a library component renders a text that is the app's by
nature.

## 5. Pruning an app's copies

After the merge, an app's `messages/<locale>.json` needs only the keys its own code
uses plus deliberate overrides of library texts. Remove every key that exists in the
library file for that locale with an identical value. A key with a different value is
an override: it stays.

- Prune a key from all of the app's locale files together, or from none: only when
  every locale file the library ships (en, it) has the library's value for it. A key
  whose English matches but whose Italian differs is an override in both files and
  stays in both.
- Never prune a key on the app-provided list.
- App specs and e2e tests that read library copy straight from the app's message file
  must read the merged messages instead (`mergeMessages(libraryXx, appXx)` for the
  locale they use).

The prune is run once per app by a throwaway script. The app's validator and full test
suite prove nothing was lost.

## 6. The library guard

`scripts/validate-messages.mjs`, chained into the library's `lint` after
`check-rtl-classes.mjs`. It fails when:

- a static key in `src` (excluding `__tests__` and `*.spec.*`), resolved the way the
  apps resolve it (`useTranslations("ns")` + `t("key")`, `getTranslations("ns")`, bare
  `t("a.b")`, in all three quote styles), is not a leaf in `messages/en.json`;
- a template-literal key (`` t(`a.${x}.b`) ``) matches no leaf, unless it is in
  `DYNAMIC_KEY_ALLOWLIST` with a written reason (ids defined by an app backend, such as
  `notification.${type}.title`). Template keys whose ids the library owns, such as
  `oauth.ui.scopes.${id}`, are enumerated in the files instead;
- a leaf in `messages/en.json` is unused. A leaf is used when a static or template key
  resolves to it, or when its full path or a dotted prefix of it appears as a string
  literal anywhere in `src` (keys reached through a constant, such as
  `labelKey: "entities.companies"` or `features/billing/i18n-keys.ts`);
- a dotted string literal on a code line of `src` whose first segment is a top-level
  namespace of `en.json` (the entries of an `i18n-keys.ts`, a `labelKey`, a label
  namespace constant) resolves to no leaf and to no prefix of leaves. Comment lines
  are not scanned;
- `messages/it.json` does not have exactly the key paths of `messages/en.json`;
- a value in either file contains an app name (`wyrdli`, `phlow`, `adhstudy`,
  `neural-erp`, `neural erp`, `a360ai`, `avvocato360`, `360studioai`, `only35`,
  `dreamer`, case-insensitive) or an app domain word.

Keys on `APP_PROVIDED_KEYS` are exempt from the first two rules and never reported as
unused. An Italian value identical to its English is reported but does not fail the
run: some are legitimately identical ("Email", "OK").
