import { useState, useRef, useEffect } from "react";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

function DeleteConfirmation({
  prompt,
  buttonClassName,
  onConfirm,
  onCancel,
}: {
  prompt: React.ReactNode;
  buttonClassName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-destructive">{prompt}</span>
      <Button
        variant="destructive"
        size="sm"
        className={buttonClassName}
        onClick={onConfirm}
      >
        Confirm
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={buttonClassName}
        onClick={onCancel}
      >
        Cancel
      </Button>
    </div>
  );
}

export function DeleteModuleButton({
  moduleId,
  moduleTitle,
}: {
  moduleId: number;
  moduleTitle: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const fetcher = useFetcher();

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      toast.success("Module deleted.");
    }
    if (fetcher.state === "idle" && fetcher.data?.error) {
      toast.error(fetcher.data.error);
    }
  }, [fetcher.state, fetcher.data]);

  if (confirming) {
    return (
      <DeleteConfirmation
        prompt={<>Delete "{moduleTitle}"?</>}
        buttonClassName="h-7 text-xs"
        onConfirm={() => {
          fetcher.submit(
            { intent: "delete-module", moduleId: String(moduleId) },
            { method: "post" }
          );
          setConfirming(false);
        }}
        onCancel={() => setConfirming(false)}
      />
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
      onClick={() => setConfirming(true)}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}

function AddModuleButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} className="mt-4">
      <Plus className="mr-1.5 size-4" />
      Add Module
    </Button>
  );
}

export function AddModuleForm() {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const fetcher = useFetcher();

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  // Reset form after successful submission
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      setTitle("");
      setIsAdding(false);
      toast.success("Module added.");
    }
    if (fetcher.state === "idle" && fetcher.data?.error) {
      toast.error(fetcher.data.error);
    }
  }, [fetcher.state, fetcher.data]);

  function handleSubmit() {
    const trimmed = title.trim();
    if (!trimmed) return;
    fetcher.submit(
      { intent: "add-module", title: trimmed },
      { method: "post" }
    );
  }

  function handleCancel() {
    setTitle("");
    setIsAdding(false);
  }

  if (!isAdding) {
    return <AddModuleButton onClick={() => setIsAdding(true)} />;
  }

  return (
    <AddModuleInput
      inputRef={inputRef}
      title={title}
      onTitleChange={setTitle}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
}

function AddModuleInput({
  inputRef,
  title,
  onTitleChange,
  onSubmit,
  onCancel,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  title: string;
  onTitleChange: (title: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      onSubmit();
    } else if (event.key === "Escape") {
      onCancel();
    }
  }

  return (
    <div className="mt-4 flex items-center gap-2">
      <Input
        ref={inputRef}
        type="text"
        placeholder="Module title..."
        value={title}
        onChange={(event) => onTitleChange(event.target.value)}
        onKeyDown={handleKeyDown}
        className="max-w-xs"
      />
      <Button size="sm" onClick={onSubmit} disabled={!title.trim()}>
        Add
      </Button>
      <Button variant="ghost" size="sm" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}

export function DeleteLessonButton({
  lessonId,
}: {
  lessonId: number;
  lessonTitle: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const fetcher = useFetcher();

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      toast.success("Lesson deleted.");
    }
    if (fetcher.state === "idle" && fetcher.data?.error) {
      toast.error(fetcher.data.error);
    }
  }, [fetcher.state, fetcher.data]);

  if (confirming) {
    return (
      <DeleteConfirmation
        prompt="Delete?"
        buttonClassName="h-6 text-xs"
        onConfirm={() => {
          fetcher.submit(
            { intent: "delete-lesson", lessonId: String(lessonId) },
            { method: "post" }
          );
          setConfirming(false);
        }}
        onCancel={() => setConfirming(false)}
      />
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
      onClick={() => setConfirming(true)}
    >
      <Trash2 className="size-3.5" />
    </Button>
  );
}
