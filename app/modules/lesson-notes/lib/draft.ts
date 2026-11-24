import { MAX_NOTE_LENGTH } from "~/lib/notes";

export type NoteDraft = {
  /** Characters that would be saved: the server trims before it stores. */
  length: number;
  maxLength: number;
  tooLong: boolean;
  empty: boolean;
  /** The draft matches what is already saved, so saving would change nothing. */
  unchanged: boolean;
  canSave: boolean;
};

export function evaluateDraft(
  draft: string,
  savedBody: string | null
): NoteDraft {
  const trimmed = draft.trim();
  const length = trimmed.length;
  const tooLong = length > MAX_NOTE_LENGTH;
  const empty = length === 0;
  const unchanged = trimmed === (savedBody ?? "");
  return {
    length,
    maxLength: MAX_NOTE_LENGTH,
    tooLong,
    empty,
    unchanged,
    canSave: !tooLong && !empty && !unchanged,
  };
}
