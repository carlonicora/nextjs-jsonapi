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

  // Always ensure types section is updated (even if features already exist)
  let typesUpdated = false;
  if (!messages.types) {
    messages.types = {};
  }
  const typesKey = Object.keys(moduleMessages.types)[0];
  const lowercasePluralKey = names.pluralCamel.toLowerCase();
  if (typesKey && !messages.types[lowercasePluralKey]) {
    messages.types[lowercasePluralKey] = moduleMessages.types[typesKey];
    typesUpdated = true;
  }

  // Check if module already exists in features
  const featuresAlreadyExist = messages.features && messages.features[lowercaseModuleName];

  if (featuresAlreadyExist) {
    // Features exist, but we may have added types
    if (typesUpdated) {
      if (dryRun) {
        return {
          success: true,
          message: `[DRY RUN] Module ${names.camelCase} exists, would add types.${lowercasePluralKey}`,
          alreadyExists: true,
        };
      }

      // Write updated content (types were added)
      const updatedContent = JSON.stringify(messages, null, 2);
      fs.writeFileSync(messagesPath, updatedContent, "utf-8");

      return {
        success: true,
        message: `Module ${names.camelCase} exists, added types.${lowercasePluralKey}`,
        alreadyExists: true,
      };
    }

    return {
      success: true,
      message: `Module ${names.camelCase} already exists in messages/${language}.json`,
      alreadyExists: true,
    };
  }

  // Add to features section (new module)
  if (!messages.features) {
    messages.features = {};
  }
  messages.features[lowercaseModuleName] = moduleMessages.features[i18nKeys.moduleName];

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
