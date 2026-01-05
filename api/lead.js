import { Resend } from "resend";

export const POST = async (request) => {
  // ログ: リクエスト情報
  const url = request.url;
  const headers = Object.fromEntries(request.headers.entries());
  let body = {};
  
  try {
    body = await request.json();
  } catch (e) {
    console.error("[LEAD API] Failed to parse request body:", e);
  }

  console.log("[LEAD API] Request received:", {
    method: "POST",
    url: url,
    headers: headers,
    body: body,
    timestamp: new Date().toISOString()
  });

  try {
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const type = String(body.type || "").trim();
    const axes = body.axes || {};
    const createdAt = String(body.createdAt || new Date().toISOString()).trim();

    console.log("[LEAD API] Parsed data:", { name, email, type, axes, createdAt });

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!name) {
      console.error("[LEAD API] Validation error: name is required");
      return Response.json({ error: "name is required" }, { status: 400 });
    }
    if (!emailOk) {
      console.error("[LEAD API] Validation error: email is invalid", email);
      return Response.json({ error: "email is invalid" }, { status: 400 });
    }
    if (!type) {
      console.error("[LEAD API] Validation error: type is required");
      return Response.json({ error: "type is required" }, { status: 400 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    const to = process.env.LEAD_TO_EMAIL || "s.hasegawa1130@gmail.com";
    const from = process.env.LEAD_FROM_EMAIL || "Shukatsu診断 <onboarding@resend.dev>";

    if (!resendKey) {
      console.error("[LEAD API] RESEND_API_KEY is missing");
      return Response.json({ error: "RESEND_API_KEY is missing" }, { status: 500 });
    }

    console.log("[LEAD API] Sending email via Resend...");
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

    const emailResult = await resend.emails.send({
      from,
      to,
      subject,
      text,
      replyTo: email
    });

    console.log("[LEAD API] Email sent successfully:", emailResult);

    return Response.json(
      { ok: true },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (e) {
    console.error("[LEAD API] Error occurred:", {
      message: e?.message,
      stack: e?.stack,
      error: e
    });
    return Response.json(
      { error: e?.message || "Internal Error" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  }
};

// OPTIONSリクエスト用のハンドラー（CORSプリフライト）
export const OPTIONS = async () => {
  console.log("[LEAD API] OPTIONS request handled");
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};
