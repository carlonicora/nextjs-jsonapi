/**
 * i18n Updater
 *
 * Updates the messages/{language}.json files with new module translations.
 */

import * as fs from "fs";
import { FrontendTemplateData } from "../types/template-data.interface";
import { buildI18nMessages } from "../transformers/i18n-generator";

export interface I18nUpdateResult {
  success: boolean;
  message: string;
  alreadyExists?: boolean;
}

/**
 * Update messages/{language}.json with new module translations
 *
 * @param data - Frontend template data
 * @param webBasePath - Base path to web app
 * @param language - Language code (e.g., "en", "es", "fr")
 * @param dryRun - Whether to perform a dry run
 * @returns Update result
 */
export function updateI18n(
  data: FrontendTemplateData,
  webBasePath: string,
  language: string = "en",
  dryRun: boolean = false
): I18nUpdateResult {
  const { names, i18nKeys } = data;
  const messagesPath = `${webBasePath}/apps/web/messages/${language}.json`;

  // Check if file exists
  if (!fs.existsSync(messagesPath)) {
    return {
      success: false,
      message: `Messages file not found at ${messagesPath}`,
    };
  }

  const content = fs.readFileSync(messagesPath, "utf-8");
  let messages: Record<string, any>;

  try {
    messages = JSON.parse(content);
  } catch (e) {
    return {
      success: false,
      message: `Failed to parse messages/${language}.json: ${e}`,
    };
  }

  // Build the i18n messages for this module
  const moduleMessages = buildI18nMessages(i18nKeys);
  const lowercaseModuleName = names.camelCase.toLowerCase();

  // Always ensure entities section is updated (even if features already exist)
  let entitiesUpdated = false;
  if (!messages.entities) {
    messages.entities = {};
  }
  const entitiesKey = Object.keys(moduleMessages.entities)[0];
  const lowercasePluralKey = names.pluralCamel.toLowerCase();
  if (entitiesKey && !messages.entities[lowercasePluralKey]) {
    messages.entities[lowercasePluralKey] = moduleMessages.entities[entitiesKey];
    entitiesUpdated = true;
  }

  // Additively merge this module's feature keys (fields / relationships /
  // sections), FILLING missing keys without overwriting existing translations.
  // Handles a brand-new module AND an existing-but-incomplete block (e.g. one
  // first generated before its fields were known — which previously stayed an
  // empty `{ fields: {}, relationships: {} }` skeleton forever).
  const mergeMissing = (target: Record<string, any>, source: Record<string, any>): Record<string, any> => {
    const out = target && typeof target === "object" && !Array.isArray(target) ? { ...target } : {};
    for (const k of Object.keys(source)) {
      const v = source[k];
      if (v && typeof v === "object" && !Array.isArray(v)) {
        out[k] = mergeMissing(out[k], v);
      } else if (out[k] === undefined) {
        out[k] = v;
      }
    }
    return out;
  };

  if (!messages.features) {
    messages.features = {};
  }
  const moduleBlock = moduleMessages.features[i18nKeys.moduleName];
  const beforeFeatures = JSON.stringify(messages.features[lowercaseModuleName] ?? null);
  messages.features[lowercaseModuleName] = mergeMissing(messages.features[lowercaseModuleName], moduleBlock);
  const featuresUpdated = JSON.stringify(messages.features[lowercaseModuleName]) !== beforeFeatures;

  if (!entitiesUpdated && !featuresUpdated) {
    return {
      success: true,
      message: `Module ${names.camelCase} already up to date in messages/${language}.json`,
      alreadyExists: true,
    };
  }

  if (dryRun) {
    return {
      success: true,
      message: `[DRY RUN] Would update messages/${language}.json with ${names.camelCase} translations`,
    };
  }

  const updatedContent = JSON.stringify(messages, null, 2);
  fs.writeFileSync(messagesPath, updatedContent, "utf-8");

  return {
    success: true,
    message: `Updated messages/${language}.json with ${names.camelCase} translations`,
  };
}

/**
 * Preview the i18n messages that would be added
 *
 * @param data - Frontend template data
 * @returns Preview of messages
 */
export function previewI18nMessages(data: FrontendTemplateData): string {
  const moduleMessages = buildI18nMessages(data.i18nKeys);
  return JSON.stringify(moduleMessages, null, 2);
}
