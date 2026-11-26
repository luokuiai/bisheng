type Translate = (key: string, options: { defaultValue: string }) => string;

/** Use the tool catalog's localized name when it has an entry for this invocation key. */
export function localizeToolName(toolKey: string | null | undefined, fallbackName: string, translate: Translate): string {
  if (!toolKey) return fallbackName;
  return translate(`tool:tools.${toolKey}.name`, { defaultValue: '' }) || fallbackName;
}
