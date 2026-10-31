"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

/** The bits of Razorpay Checkout we use. The script is loaded from Razorpay on click. */
interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  theme: { color: string };
  prefill: { name: string; email: string };
  handler: (response: RazorpayResponse) => void;
  modal: { ondismiss: () => void };
}
interface RazorpayInstance {
  open: () => void;
  on: (event: "payment.failed", cb: (r: { error: { description: string } }) => void) => void;
}
declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadCheckout(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = CHECKOUT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "paid" };

export function BuyButton({ label, name, email }: { label: string; name: string; email: string }) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function buy() {
    setStatus({ kind: "loading" });
    try {
      // The server decides the amount; we only ask it for an order.
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setStatus({
          kind: "error",
          message: body?.error?.message ?? "Could not start the payment. Please try again.",
        });
        return;
      }

      if (!(await loadCheckout()) || !window.Razorpay) {
        setStatus({ kind: "error", message: "Could not load the payment window. Check your connection and try again." });
        return;
      }

      const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
      const checkout = new window.Razorpay({
        key: body.keyId,
        amount: body.amount,
        currency: body.currency,
        order_id: body.orderId,
        name: "GATE Saathi",
        description: "Premium pass (one-time)",
        theme: { color: accent },
        prefill: { name, email },
        // The popup reports success here, but the browser can be lied to. Premium is
        // only granted after the server verifies the signature (next part of #9).
        handler: () => setStatus({ kind: "paid" }),
        modal: { ondismiss: () => setStatus({ kind: "idle" }) },
      });
      checkout.on("payment.failed", (r) =>
        setStatus({ kind: "error", message: r.error.description || "The payment failed. Please try again." }),
      );
      checkout.open();
    } catch {
      setStatus({ kind: "error", message: "Something went wrong. Please try again." });
    }
  }

  if (status.kind === "paid") {
    return (
      <p role="status" className="text-sm">
        Payment received. We are confirming it with Razorpay.
      </p>
    );
  }

  return (
    <div>
      <Button type="button" className="w-full" onClick={buy} disabled={status.kind === "loading"}>
        {status.kind === "loading" ? "Opening payment…" : label}
      </Button>
      {status.kind === "error" && (
        <p role="alert" className="mt-3 text-sm text-[var(--error)]">
          {status.message}
        </p>
      )}
    </div>
  );
}
