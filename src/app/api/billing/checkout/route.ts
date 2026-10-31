import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import {
  isPaymentsEnabled,
  createPremiumOrder,
  razorpayKeyId,
  PREMIUM_PRICE_PAISE,
} from "@/lib/payments";

/**
 * Start a Premium purchase: create a Razorpay order for the server-side price
 * and remember it as a `created` Payment. The browser sends no body, so it
 * cannot choose the amount.
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return fail(401, "UNAUTHORIZED", "Sign in to buy Premium");

  if (!isPaymentsEnabled()) {
    return fail(503, "PAYMENTS_UNAVAILABLE", "Payments are coming soon");
  }
  if (user.isPremium) return fail(409, "ALREADY_PREMIUM", "You already have Premium");

  const limited = await rateLimit("billing-checkout", user.id, 5, 60_000);
  if (limited) return limited;

  let order;
  try {
    order = await createPremiumOrder(`prem_${user.id.slice(-12)}_${Date.now().toString(36)}`, user.id);
  } catch (e) {
    console.error("Razorpay order creation failed", e);
    return fail(502, "PAYMENT_PROVIDER_ERROR", "Could not start the payment. Please try again.");
  }

  await db.payment.create({
    data: {
      userId: user.id,
      orderId: order.id,
      amountPaise: PREMIUM_PRICE_PAISE,
      currency: "INR",
      status: "created",
    },
  });

  return ok({
    orderId: order.id,
    amount: PREMIUM_PRICE_PAISE,
    currency: "INR",
    keyId: razorpayKeyId(),
  });
}
