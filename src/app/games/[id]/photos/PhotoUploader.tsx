"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { attachPhotos } from "./actions";

const BUCKET = "retro-games";

export function PhotoUploader({ gameId }: { gameId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be signed in to upload photos.");
      return;
    }

    const uploaded: string[] = [];
    setProgress({ done: 0, total: files.length });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      // Path: <owner_id>/<game_id>/<timestamp>-<index>.<ext>
      // Owner-id prefix matches the storage RLS rule.
      const path = `${user.id}/${gameId}/${Date.now()}-${i}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type });

      if (upErr) {
        setError(`Upload failed for ${file.name}: ${upErr.message}`);
        return;
      }
      uploaded.push(path);
      setProgress({ done: i + 1, total: files.length });
    }

    startTransition(async () => {
      try {
        await attachPhotos(gameId, uploaded);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setProgress(null);
      }
    });
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Add photos</label>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleChange}
        disabled={isPending || progress !== null}
        className="block text-sm"
      />
      {progress && (
        <p className="text-xs text-gray-600">
          Uploading {progress.done} / {progress.total}…
        </p>
      )}
      {isPending && <p className="text-xs text-gray-600">Saving…</p>}
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
