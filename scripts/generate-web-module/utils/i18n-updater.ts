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

  // Check if module already exists in features
  if (messages.features && messages.features[names.camelCase]) {
    return {
      success: true,
      message: `Module ${names.camelCase} already exists in messages/${language}.json`,
      alreadyExists: true,
    };
  }

  // Build the i18n messages for this module
  const moduleMessages = buildI18nMessages(i18nKeys);

  // Add to features section
  if (!messages.features) {
    messages.features = {};
  }
  messages.features[names.camelCase] = moduleMessages.features[i18nKeys.moduleName];

  // Add to types section (if not exists)
  if (!messages.types) {
    messages.types = {};
  }
  const typesKey = Object.keys(moduleMessages.types)[0];
  const lowercasePluralKey = names.pluralCamel.toLowerCase();
  if (typesKey && !messages.types[lowercasePluralKey]) {
    messages.types[lowercasePluralKey] = moduleMessages.types[typesKey];
  }

  if (dryRun) {
    return {
      success: true,
      message: `[DRY RUN] Would update messages/${language}.json with ${names.camelCase} translations`,
    };
  }

  // Write updated content with proper formatting
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
