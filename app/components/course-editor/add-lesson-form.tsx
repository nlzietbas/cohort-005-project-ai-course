import { useState, useRef, useEffect } from "react";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Plus } from "lucide-react";

type Draft = { title: string; durationMinutes: string };

const EMPTY_DRAFT: Draft = { title: "", durationMinutes: "" };

function submitOrCancelOnKey(onSubmit: () => void, onCancel: () => void) {
  return (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSubmit();
    } else if (event.key === "Escape") {
      onCancel();
    }
  };
}

function isComplete(draft: Draft) {
  return (
    draft.title.trim() !== "" && Number.parseInt(draft.durationMinutes) > 0
  );
}

export function AddLessonForm({ moduleId }: { moduleId: number }) {
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const fetcher = useFetcher();

  function close() {
    setDraft(EMPTY_DRAFT);
    setIsAdding(false);
  }

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      setDraft(EMPTY_DRAFT);
      setIsAdding(false);
      toast.success("Lesson added.");
    }
    if (fetcher.state === "idle" && fetcher.data?.error) {
      toast.error(fetcher.data.error);
    }
  }, [fetcher.state, fetcher.data]);

  function handleSubmit() {
    if (!isComplete(draft)) return;
    fetcher.submit(
      {
        intent: "add-lesson",
        moduleId: String(moduleId),
        title: draft.title.trim(),
        durationMinutes: draft.durationMinutes,
      },
      { method: "post" }
    );
  }

  if (!isAdding) {
    return <AddLessonToggle onOpen={() => setIsAdding(true)} />;
  }

  return (
    <AddLessonFields
      draft={draft}
      onChange={setDraft}
      onSubmit={handleSubmit}
      onCancel={close}
    />
  );
}

function AddLessonToggle({ onOpen }: { onOpen: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onOpen}
      className="mt-2 text-muted-foreground"
    >
      <Plus className="mr-1 size-3.5" />
      Add Lesson
    </Button>
  );
}

function AddLessonFields({
  draft,
  onChange,
  onSubmit,
  onCancel,
}: {
  draft: Draft;
  onChange: (draft: Draft) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const handleKeyDown = submitOrCancelOnKey(onSubmit, onCancel);

  return (
    <div className="mt-2 flex items-center gap-2">
      <Input
        ref={titleRef}
        type="text"
        placeholder="Lesson title..."
        aria-label="Lesson title"
        value={draft.title}
        onChange={(event) => onChange({ ...draft, title: event.target.value })}
        onKeyDown={handleKeyDown}
        className="max-w-xs text-sm"
      />
      <Input
        type="number"
        min="1"
        step="1"
        placeholder="Video min"
        aria-label="Video length in minutes"
        value={draft.durationMinutes}
        onChange={(event) =>
          onChange({ ...draft, durationMinutes: event.target.value })
        }
        onKeyDown={handleKeyDown}
        className="w-28 text-sm"
      />
      <AddLessonButtons
        canSubmit={isComplete(draft)}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    </div>
  );
}

function AddLessonButtons({
  canSubmit,
  onSubmit,
  onCancel,
}: {
  canSubmit: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <Button
        size="sm"
        className="h-8"
        onClick={onSubmit}
        disabled={!canSubmit}
      >
        Add
      </Button>
      <Button variant="ghost" size="sm" className="h-8" onClick={onCancel}>
        Cancel
      </Button>
    </>
  );
}
