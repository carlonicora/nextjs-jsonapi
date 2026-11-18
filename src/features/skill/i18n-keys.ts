/**
 * The fixed namespace of i18n keys the skill screens read via useTranslations.
 * The package ships English and Italian texts for each in messages/*.json; an
 * app that wants different wording overrides the value in its own message
 * file, never the key.
 *
 * Mirrors features/ai-connection/i18n-keys.ts.
 */
export const SKILL_I18N_KEYS = [
  "skill.columns.name",
  "skill.columns.description",
  "skill.columns.origin",
  "skill.columns.active",
  "skill.origin.global",
  "skill.origin.copy",
  "skill.origin.company",
  "skill.hidden",
  "skill.empty.title",
  "skill.empty.body",
  "skill.empty.global",
  "skill.buttons.new",
  "skill.buttons.restore",
  "skill.editor.create",
  "skill.editor.edit",
  "skill.fields.name.label",
  "skill.fields.name.help",
  "skill.fields.name.error",
  "skill.fields.name.taken",
  "skill.fields.name.used",
  "skill.fields.name.global",
  "skill.fields.description.label",
  "skill.fields.description.help",
  "skill.fields.description.error",
  "skill.fields.instructions.label",
  "skill.fields.instructions.help",
  "skill.fields.instructions.error",
  "skill.fields.active.label",
  "skill.counter",
  "skill.notice.global",
  "skill.notice.copy",
  "skill.restore.confirm",
  "skill.delete.global",
  "skill.errors.limit",
  "skill.errors.changed",
  "skill.errors.switch",
  "skill.admin.picker.label",
  "skill.admin.picker.global",
  "skill.admin.title",
] as const;
