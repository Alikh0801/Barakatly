"use client";

import Script from "next/script";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          execution?: "render" | "execute";
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => string;
      execute: (widgetId: string) => void;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export type TurnstileHandle = {
  /** Runs the challenge on demand and resolves with a fresh, single-use token. */
  getToken: () => Promise<string>;
};

export const Turnstile = forwardRef<TurnstileHandle, { siteKey: string }>(
  function Turnstile({ siteKey }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetId = useRef<string | null>(null);
    const pendingResolve = useRef<((token: string) => void) | null>(null);
    const [scriptReady, setScriptReady] = useState(false);

    useEffect(() => {
      if (!scriptReady || !containerRef.current || !window.turnstile) return;

      widgetId.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        // Don't generate a token at render — wait until getToken() calls
        // execute(), so the token is always seconds-old at submit time.
        execution: "execute",
        callback: (token) => {
          pendingResolve.current?.(token);
          pendingResolve.current = null;
        },
        "error-callback": () => {
          pendingResolve.current?.("");
          pendingResolve.current = null;
        },
      });

      return () => {
        if (widgetId.current) {
          window.turnstile?.remove(widgetId.current);
          widgetId.current = null;
        }
      };
    }, [scriptReady, siteKey]);

    useImperativeHandle(ref, () => ({
      getToken: () =>
        new Promise<string>((resolve) => {
          if (!window.turnstile || !widgetId.current) {
            resolve("");
            return;
          }
          pendingResolve.current = resolve;
          // Clear any previous token, then run a fresh challenge.
          window.turnstile.reset(widgetId.current);
          window.turnstile.execute(widgetId.current);
        }),
    }));

    return (
      <>
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="afterInteractive"
          onReady={() => setScriptReady(true)}
        />
        <div ref={containerRef} />
      </>
    );
  }
);
