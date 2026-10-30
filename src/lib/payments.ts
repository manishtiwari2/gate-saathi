const DEFAULT_PRICE_PAISE = 4900; // Rs 49

function readPrice(): number {
  const n = Number(process.env.PREMIUM_PRICE_PAISE);
  // Empty, missing or nonsense values fall back to the default price.
  return Number.isInteger(n) && n > 0 ? n : DEFAULT_PRICE_PAISE;
}

/** Price of the Premium pass in paise. Server-side only: the browser never sets the amount. */
export const PREMIUM_PRICE_PAISE = readPrice();

/** True only when both Razorpay keys are set. Without them, payment UI shows "coming soon". */
export function isPaymentsEnabled(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

/** 4900 -> "₹49", 4950 -> "₹49.50". */
export function formatRupees(paise: number): string {
  const rupees = paise / 100;
  return `₹${Number.isInteger(rupees) ? rupees : rupees.toFixed(2)}`;
}
