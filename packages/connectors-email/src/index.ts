import type { DestinationConnector, DestinationConfig } from "@shiplog/core";

// Swap this for Postmark, SES, or SMTP later -- the connector interface
// doesn't care what's behind it. Using Resend's HTTP API here because it
// needs no extra SDK dependency.
export const emailConnector: DestinationConnector = {
  type: "email",
  async send(text: string, destination: DestinationConfig) {
    const apiKey = process.env.RESEND_API_KEY;
    const to = destination.settings.to as string | undefined;
    if (!apiKey || !to) return { ok: false, error: "missing RESEND_API_KEY or settings.to" };

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: destination.settings.from ?? "ship@yourdomain.com",
          to,
          subject: destination.settings.subject ?? "Product update",
          text,
        }),
      });
      if (!res.ok) return { ok: false, error: `resend returned ${res.status}` };
      return { ok: true };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  },
};
