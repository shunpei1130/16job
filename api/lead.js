import { Resend } from "resend";

export default async function handler(req, res) {
  // CORS対応
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Vercelではreq.bodyが既にパースされている場合がある
    const body = req.body || {};

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const type = String(body.type || "").trim();
    const axes = body.axes || {};
    const createdAt = String(body.createdAt || new Date().toISOString()).trim();

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!name) return res.status(400).json({ error: "name is required" });
    if (!emailOk) return res.status(400).json({ error: "email is invalid" });
    if (!type) return res.status(400).json({ error: "type is required" });

    const resendKey = process.env.RESEND_API_KEY;
    const to = process.env.LEAD_TO_EMAIL || "s.hasegawa1130@gmail.com";
    const from = process.env.LEAD_FROM_EMAIL || "Shukatsu診断 <onboarding@resend.dev>";

    if (!resendKey) return res.status(500).json({ error: "RESEND_API_KEY is missing" });

    const resend = new Resend(resendKey);

    const subject = `【診断リード】${name} / ${email} / ${type}`;
    const text = [
      `createdAt: ${createdAt}`,
      `name: ${name}`,
      `email: ${email}`,
      `type: ${type}`,
      `axes: ${JSON.stringify(axes)}`,
      "",
      "raw:",
      JSON.stringify(body),
    ].join("\n");

    await resend.emails.send({
      from,
      to,
      subject,
      text,
      replyTo: email
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Internal Error" });
  }
}
