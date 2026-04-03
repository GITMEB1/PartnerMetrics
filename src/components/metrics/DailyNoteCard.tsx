"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { upsertNote } from "@/server/actions/notes";
import { StickyNote, Check, Loader2 } from "lucide-react";

type DailyNoteCardProps = {
  note: string | null;
  date: string;
  userName: string;
  editable: boolean;
};

export function DailyNoteCard({ note, date, userName, editable }: DailyNoteCardProps) {
  const [text, setText] = useState(note ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    if (!text.trim()) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("entry_date", date);
      formData.set("note", text);
      await upsertNote(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{userName}&apos;s Note</span>
          </div>
          {saved && (
            <Badge variant="success" className="animate-check-pop text-[10px]">
              <Check className="h-3 w-3 mr-0.5" />
              Saved
            </Badge>
          )}
        </div>
        {editable ? (
          <div className="space-y-2">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="How was your day?"
              className="min-h-[60px] text-sm"
              maxLength={300}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {text.length}/300
              </span>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isPending || !text.trim() || text === note}
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : (
                  <Check className="h-3.5 w-3.5 mr-1" />
                )}
                Save
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {note || "No note today"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
