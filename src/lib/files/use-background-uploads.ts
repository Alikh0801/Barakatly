"use client";

import { useRef, useState } from "react";

export type UploadOutcome = { path: string } | { error: string };
export type UploadStatus = "uploading" | "done" | "error";

/**
 * Per-file uploads that start as soon as the farmer confirms the files and
 * run in the background while the rest of the form is filled in. Each file
 * is uploaded at most once: submitting awaits the uploads already in flight
 * instead of sending the same file again, and only a failed upload is
 * retried.
 */
export function useBackgroundUploads(upload: (file: File) => Promise<UploadOutcome>) {
  const inFlight = useRef(new Map<File, Promise<UploadOutcome>>());
  const [statuses, setStatuses] = useState<Map<File, UploadStatus>>(() => new Map());

  function setStatus(file: File, status: UploadStatus) {
    setStatuses((previous) => new Map(previous).set(file, status));
  }

  function start(file: File): Promise<UploadOutcome> {
    const existing = inFlight.current.get(file);
    if (existing) return existing;

    setStatus(file, "uploading");
    const promise = upload(file).then((outcome) => {
      setStatus(file, "error" in outcome ? "error" : "done");
      // Forget failures so the next attempt uploads afresh.
      if ("error" in outcome) inFlight.current.delete(file);
      return outcome;
    });
    inFlight.current.set(file, promise);
    return promise;
  }

  /** Starts (or joins) every upload and resolves to the paths, in order. */
  async function finishAll(files: File[]): Promise<{ paths: string[] } | { error: string }> {
    const outcomes = await Promise.all(files.map(start));
    const paths: string[] = [];
    for (const outcome of outcomes) {
      if ("error" in outcome) return { error: outcome.error };
      paths.push(outcome.path);
    }
    return { paths };
  }

  return {
    start,
    finishAll,
    statusOf: (file: File) => statuses.get(file),
    doneCount: (files: File[]) => files.filter((file) => statuses.get(file) === "done").length,
  };
}
