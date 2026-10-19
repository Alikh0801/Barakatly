"use client";

import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/ui/Spinner";

/**
 * Spins while the form it sits in is submitting — put it inside the submit
 * button. Only that form's button spins when a card has several forms.
 */
export function FormPendingSpinner({ className = "h-3.5 w-3.5" }: { className?: string }) {
  const { pending } = useFormStatus();
  return pending ? <Spinner className={className} /> : null;
}
