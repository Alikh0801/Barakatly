"use client";

import { useState } from "react";

/**
 * An editable content card with an on/off switch. A switched-off card stays
 * editable here but is hidden on the site, and the remaining cards there
 * close up. The state always posts as `name` = "1" or "0".
 *
 * Uncontrolled by default; pass `enabled` and `onToggle` to control it.
 */
export function ToggleableCard({
  label,
  name,
  defaultEnabled = true,
  enabled: controlledEnabled,
  onToggle,
  actions,
  children,
}: {
  label: string;
  name: string;
  defaultEnabled?: boolean;
  enabled?: boolean;
  onToggle?: (enabled: boolean) => void;
  /** Extra controls in the header, e.g. a delete button. */
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [ownEnabled, setOwnEnabled] = useState(defaultEnabled);
  const enabled = controlledEnabled ?? ownEnabled;

  function toggle() {
    const next = !enabled;
    if (controlledEnabled === undefined) setOwnEnabled(next);
    onToggle?.(next);
  }

  return (
    <div
      className={`space-y-3 rounded-xl p-4 ring-1 transition-colors ${
        enabled ? "bg-zinc-50 ring-zinc-200" : "bg-zinc-100 ring-zinc-200"
      }`}
    >
      <input type="hidden" name={name} value={enabled ? "1" : "0"} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
          {enabled ? null : (
            <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
              Saytda görünmür
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {actions}
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label={`${label}: ${enabled ? "aktiv" : "deaktiv"}`}
            data-static-hover
            onClick={toggle}
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-700"
          >
            <span
              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
                enabled ? "bg-emerald-600" : "bg-zinc-300"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-[left] ${
                  enabled ? "left-[1.125rem]" : "left-0.5"
                }`}
              />
            </span>
            {enabled ? "Aktiv" : "Deaktiv"}
          </button>
        </div>
      </div>
      <div className={enabled ? "space-y-3" : "space-y-3 opacity-60"}>{children}</div>
    </div>
  );
}
