"use client";

import { useActionState, useState } from "react";
import { cancelOrderItem, type FarmerActionState } from "@/lib/farmer/actions";
import { CANCEL_REASON_MAX, CANCEL_REASON_MIN } from "@/lib/orders/item-cancel";
import { Spinner } from "@/components/ui/Spinner";

const initialState: FarmerActionState = {};

/** The reason box shown after the farmer presses "Ləğv et". */
export function CancelOrderItemForm({
  itemId,
  productTitle,
  onClose,
}: {
  itemId: string;
  productTitle: string;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(cancelOrderItem, initialState);
  const [reason, setReason] = useState("");
  const tooShort = reason.trim().length < CANCEL_REASON_MIN;

  return (
    <form action={action} className="mt-3 rounded-xl bg-rose-50/60 p-3 ring-1 ring-rose-100">
      <input type="hidden" name="order_item_id" value={itemId} />
      <label htmlFor={`cancel-${itemId}`} className="block text-sm font-medium text-zinc-800">
        &quot;{productTitle}&quot; niyə ləğv olunur?
      </label>
      <textarea
        id={`cancel-${itemId}`}
        name="cancel_reason"
        required
        rows={3}
        minLength={CANCEL_REASON_MIN}
        maxLength={CANCEL_REASON_MAX}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Məs: Məhsul anbarda qalmayıb"
        autoFocus
        className="mt-2 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-900 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-200 sm:text-sm"
      />
      <p className="mt-1 text-right text-xs tabular-nums text-zinc-400">
        {reason.length}/{CANCEL_REASON_MAX}
      </p>
      {state.error ? (
        <p className="mt-2 rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-800">{state.error}</p>
      ) : null}
      <div className="mt-2 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50 disabled:opacity-60"
        >
          Geri
        </button>
        <button
          type="submit"
          disabled={pending || tooShort}
          className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
        >
          {pending ? <Spinner className="h-3.5 w-3.5" /> : null}
          Ləğvi təsdiqlə
        </button>
      </div>
    </form>
  );
}
