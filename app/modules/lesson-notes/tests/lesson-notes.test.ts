import { describe, it, expect } from "vitest";
import { noteDraft } from "../index";
import { MAX_NOTE_LENGTH } from "~/lib/notes";

describe("noteDraft", () => {
  it("can save new text when there is no Note yet", () => {
    expect(noteDraft("Generics are templates", null)).toEqual({
      length: 22,
      maxLength: MAX_NOTE_LENGTH,
      tooLong: false,
      empty: false,
      unchanged: false,
      canSave: true,
    });
  });

  it("cannot save an empty or whitespace-only draft", () => {
    const draft = noteDraft("   \n ", null);
    expect(draft.empty).toBe(true);
    expect(draft.length).toBe(0);
    expect(draft.canSave).toBe(false);
  });

  it("treats an empty box with no Note yet as nothing to save", () => {
    expect(noteDraft("", null).unchanged).toBe(true);
  });

  it("cannot save a draft that matches the saved Note", () => {
    const draft = noteDraft("same text", "same text");
    expect(draft.unchanged).toBe(true);
    expect(draft.canSave).toBe(false);
  });

  it("ignores surrounding whitespace, as the server trims before saving", () => {
    const draft = noteDraft("  same text \n", "same text");
    expect(draft.unchanged).toBe(true);
    expect(draft.length).toBe(9);
  });

  it("can save an edit to a saved Note", () => {
    const draft = noteDraft("new text", "old text");
    expect(draft.unchanged).toBe(false);
    expect(draft.canSave).toBe(true);
  });

  it("allows exactly the limit", () => {
    const draft = noteDraft("a".repeat(MAX_NOTE_LENGTH), null);
    expect(draft.tooLong).toBe(false);
    expect(draft.canSave).toBe(true);
  });

  it("cannot save one character over the limit", () => {
    const draft = noteDraft("a".repeat(MAX_NOTE_LENGTH + 1), null);
    expect(draft.tooLong).toBe(true);
    expect(draft.canSave).toBe(false);
  });
});
