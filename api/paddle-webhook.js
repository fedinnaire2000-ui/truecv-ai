import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const config = {
  api: { bodyParser: false },
};

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function verifySignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(";").map((p) => p.split("="))
  );
  const { ts, h1 } = parts;
  if (!ts || !h1) return false;
  const signedPayload = `${ts}:${rawBody}`;
  const expected = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(h1));
  } catch {
    return false;
  }
}

const PRICE_TO_PLAN = {
  pri_01m0wbfbksndq26a2e3n9656yh: "pro",
  pri_01m0wbqte7m66z3gn7ycve2vzk: "career",
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const rawBody = await readRawBody(req);
  const signatureHeader = req.headers["paddle-signature"];
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;

  if (!webhookSecret || !verifySignature(rawBody, signatureHeader, webhookSecret)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const eventType = event.event_type;
  const relevantEvents = ["transaction.completed", "subscription.activated", "subscription.updated"];
  if (!relevantEvents.includes(eventType)) {
    return res.status(200).json({ received: true, skipped: true });
  }

  const data = event.data || {};
  const customerEmail = data.customer?.email || data.customer_email || null;
  const items = data.items || [];
  const priceId = items[0]?.price?.id || items[0]?.price_id || null;
  const plan = PRICE_TO_PLAN[priceId] || null;

  if (!customerEmail || !plan) {
    return res.status(200).json({ received: true, skipped: true, reason: "missing email or unknown price" });
  }

  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) return res.status(500).json({ error: listError.message });

  const matchedUser = users.users.find((u) => u.email?.toLowerCase() === customerEmail.toLowerCase());
  if (!matchedUser) {
    return res.status(200).json({ received: true, skipped: true, reason: "no matching user account yet" });
  }

  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({ plan, paddle_customer_email: customerEmail })
    .eq("id", matchedUser.id);

  if (updateError) return res.status(500).json({ error: updateError.message });

  return res.status(200).json({ received: true, updated: true, plan });
}
