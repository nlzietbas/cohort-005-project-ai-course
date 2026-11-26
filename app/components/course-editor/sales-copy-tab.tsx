import { useState, useEffect } from "react";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import { MonacoMarkdownEditor } from "~/components/monaco-markdown-editor";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Save } from "lucide-react";
import type { EditorCourse } from "./types";

export function SalesCopyTab({ course }: { course: EditorCourse }) {
  const salesCopyFetcher = useFetcher();

  const [salesCopy, setSalesCopy] = useState<string>(course.salesCopy);
  const salesCopyHasChanges = salesCopy !== course.salesCopy;
  const salesCopyIsEmpty = salesCopy.trim().length === 0;

  useEffect(() => {
    if (salesCopyFetcher.state === "idle" && salesCopyFetcher.data?.success) {
      toast.success("Sales copy saved.");
    }
    if (salesCopyFetcher.state === "idle" && salesCopyFetcher.data?.error) {
      toast.error(salesCopyFetcher.data.error);
    }
  }, [salesCopyFetcher.state, salesCopyFetcher.data]);

  function handleSalesCopySave() {
    salesCopyFetcher.submit(
      { intent: "update-sales-copy", salesCopy },
      { method: "post" }
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Sales Copy</h2>
        <p className="text-sm text-muted-foreground">
          Write the course sales copy in Markdown. This is shown on the public
          course page. Press Ctrl+S to format and save.
        </p>
      </CardHeader>
      <CardContent>
        <MonacoMarkdownEditor
          value={salesCopy}
          onChange={setSalesCopy}
          onSave={handleSalesCopySave}
        />
        <SalesCopySaveBar
          onSave={handleSalesCopySave}
          hasChanges={salesCopyHasChanges}
          isEmpty={salesCopyIsEmpty}
          isSaving={salesCopyFetcher.state !== "idle"}
        />
      </CardContent>
    </Card>
  );
}

function SalesCopySaveBar({
  onSave,
  hasChanges,
  isEmpty,
  isSaving,
}: {
  onSave: () => void;
  hasChanges: boolean;
  isEmpty: boolean;
  isSaving: boolean;
}) {
  return (
    <div className="mt-4 flex items-center gap-4">
      <Button onClick={onSave} disabled={!hasChanges || isEmpty || isSaving}>
        <Save className="mr-1.5 size-4" />
        {isSaving ? "Saving..." : "Save Sales Copy"}
      </Button>
      {isEmpty ? (
        <span className="text-sm text-destructive">
          Sales copy cannot be empty.
        </span>
      ) : (
        hasChanges && (
          <span className="text-sm text-muted-foreground">
            You have unsaved changes.
          </span>
        )
      )}
    </div>
  );
}
