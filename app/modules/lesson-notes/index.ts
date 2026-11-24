import { evaluateDraft, type NoteDraft } from "./lib/draft";

export type { NoteDraft };

/**
 * What the Lesson note form shows for the text in the box: the character
 * count against the limit, and whether Save would do anything.
 * `savedBody` is the Note as last saved, or null when there is none yet.
 */
export function noteDraft(draft: string, savedBody: string | null): NoteDraft {
  return evaluateDraft(draft, savedBody);
}
