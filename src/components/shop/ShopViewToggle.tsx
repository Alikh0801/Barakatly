"use client";

import { useSyncExternalStore } from "react";

export type ShopView = "grid" | "list";

const STORAGE_KEY = "barakatly:shop-view";
const listeners = new Set<() => void>();

function readView(): ShopView {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function setView(view: ShopView) {
  try {
    window.localStorage.setItem(STORAGE_KEY, view);
  } catch {
    // Private mode or blocked storage: the choice just isn't remembered.
  }
  listeners.forEach((listener) => listener());
}

/**
 * The shop's grid or list view, remembered in this browser. The server
 * (and the first render after it) always shows the grid.
 */
export function useShopView(): [ShopView, (view: ShopView) => void] {
  const view = useSyncExternalStore(subscribe, readView, () => "grid" as const);
  return [view, setView];
}

function GridIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4">
      <rect x="3" y="3" width="6" height="6" rx="1.2" />
      <rect x="11" y="3" width="6" height="6" rx="1.2" />
      <rect x="3" y="11" width="6" height="6" rx="1.2" />
      <rect x="11" y="11" width="6" height="6" rx="1.2" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="h-4 w-4">
      <path d="M7.5 5h9M7.5 10h9M7.5 15h9" strokeLinecap="round" />
      <circle cx="3.75" cy="5" r="1" fill="currentColor" stroke="none" />
      <circle cx="3.75" cy="10" r="1" fill="currentColor" stroke="none" />
      <circle cx="3.75" cy="15" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ShopViewToggle({
  view,
  onChange,
}: {
  view: ShopView;
  onChange: (view: ShopView) => void;
}) {
  const options = [
    { value: "grid" as const, label: "Şəbəkə görünüşü", icon: <GridIcon /> },
    { value: "list" as const, label: "Siyahı görünüşü", icon: <ListIcon /> },
  ];
  return (
    <div className="inline-flex rounded-full bg-white p-1 shadow-sm ring-1 ring-zinc-200" role="group" aria-label="Görünüş">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={view === option.value}
          aria-label={option.label}
          title={option.label}
          className={[
            "inline-flex h-8 w-8 items-center justify-center rounded-full transition",
            view === option.value
              ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
              : "text-zinc-400 hover:text-zinc-700",
          ].join(" ")}
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
}
