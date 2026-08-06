#!/usr/bin/env node
/**
 * Stripe Connect onboarding helper — reusable for ANY customer.
 *
 * Creates an Express connected account for a business owner (no Stripe
 * account needed on their side — they just click the onboarding link and
 * enter bank + tax info), optionally sets the payout schedule, and prints
 * the "connect your bank" link to send them.
 *
 * Usage:
 *   node scripts/stripe-connect.js <Business Name> <owner@email.com>
 *   node scripts/stripe-connect.js "Studio 92 Braids" hello@studio92braids.com
 *
 * Env:
 *   STRIPE_KEY        — platform secret key (defaults to ~/Developer/private_keys/stripe.json)
 *   FEE_PERCENT       — platform commission (default 5, used by the app's .env)
 *   PAYOUT_INTERVAL   — daily | weekly | manual (default daily)
 *   RETURN_URL        — HTTPS redirect after onboarding (default https://kalkidan.app/?onboarding=complete)
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

const [name, email] = process.argv.slice(2);
if (!name || !email) {
  console.error("Usage: node scripts/stripe-connect.js <Business Name> <owner@email.com>");
  process.exit(1);
}

const key =
  process.env.STRIPE_KEY ||
  fs
    .readFileSync(path.join(os.homedir(), "Developer/private_keys/stripe.json"), "utf8")
    .replace(/^Stripe:\s*/, "")
    .trim();

const feePercent = Number(process.env.FEE_PERCENT) || 5;
const payoutInterval = process.env.PAYOUT_INTERVAL || "daily";
const returnUrl = process.env.RETURN_URL || "https://kalkidan.app/?onboarding=complete";

async function api(method, pathname, body) {
  const res = await fetch(`https://api.stripe.com/v1${pathname}`, {
    method,
    headers: { Authorization: `Bearer ${key}` },
    body: body ? new URLSearchParams(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    console.error(`Stripe error (${res.status}): ${data.error?.message}`);
    process.exit(1);
  }
  return data;
}

(async () => {
  console.log(`\n▶ Creating Express connected account for "${name}" <${email}>`);

  const account = await api("POST", "/accounts", {
    type: "express",
    country: "US",
    email,
    "business_profile[name]": name,
    "business_profile[product_description]": "Booking deposits for " + name,
    "capabilities[transfers][requested]": "true",
    "capabilities[card_payments][requested]": "true",
  });

  console.log(`  ✅ Connected account: ${account.id}`);

  if (payoutInterval !== "daily") {
    await api("PATCH", `/accounts/${account.id}`, {
      "settings[payouts][schedule][interval]": payoutInterval,
    });
    console.log(`  ✅ Payout schedule set to: ${payoutInterval}`);
  } else {
    console.log(`  ✅ Payout schedule: daily (default, ACH to owner's bank)`);
  }

  const link = await api("POST", "/account_links", {
    account: account.id,
    type: "account_onboarding",
    refresh_url: returnUrl.replace("complete", "refresh"),
    return_url: returnUrl,
  });

  console.log(`\n🔗 SEND THIS LINK TO THE OWNER (expires ~7 days):\n\n  ${link.url}\n`);
  console.log(`After they finish, verify with:\n  node scripts/stripe-connect.js --check ${account.id}\n`);
  console.log(`App config for this customer's .env:\n  STRIPE_CONNECTED_ACCOUNT=${account.id}\n  PLATFORM_FEE_PERCENT=${feePercent}\n`);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
