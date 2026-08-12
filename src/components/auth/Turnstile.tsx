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
          size?: "normal" | "flexible" | "compact";
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export type TurnstileHandle = {
  /** Returns the token from the visible widget (waits if not solved yet). */
  getToken: () => Promise<string>;
};

export const Turnstile = forwardRef<TurnstileHandle, { siteKey: string }>(
  function Turnstile({ siteKey }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetId = useRef<string | null>(null);
    const tokenRef = useRef<string>("");
    const pendingResolve = useRef<((token: string) => void) | null>(null);
    const [scriptReady, setScriptReady] = useState(false);

    useEffect(() => {
      if (!scriptReady || !containerRef.current || !window.turnstile) return;

      // Visible ("managed") widget: it renders and runs the challenge on page
      // load, then fires the callback with a token.
      widgetId.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        // Fill the form width (min 300px, up to 100% of the container).
        size: "flexible",
        callback: (token) => {
          tokenRef.current = token;
          pendingResolve.current?.(token);
          pendingResolve.current = null;
        },
        "expired-callback": () => {
          tokenRef.current = "";
        },
        "error-callback": () => {
          tokenRef.current = "";
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
            resolve(tokenRef.current);
            return;
          }
          if (tokenRef.current) {
            const token = tokenRef.current;
            // Tokens are single-use: clear and refresh so a repeated submit
            // gets a fresh token instead of a duplicate.
            tokenRef.current = "";
            window.turnstile.reset(widgetId.current);
            resolve(token);
            return;
          }
          // Challenge not solved yet — wait for the callback.
          pendingResolve.current = resolve;
        }),
    }));

    return (
      <>
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="afterInteractive"
          onReady={() => setScriptReady(true)}
        />
        <div ref={containerRef} className="w-full" />
      </>
    );
  }
);
