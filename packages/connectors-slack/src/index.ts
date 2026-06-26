import type { DestinationConnector, DestinationConfig } from "@shiplog/core";

export const slackConnector: DestinationConnector = {
  type: "slack",
  async send(text: string, destination: DestinationConfig) {
    const webhookUrl = destination.settings.webhookUrl as string | undefined;
    if (!webhookUrl) return { ok: false, error: "missing settings.webhookUrl" };

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return { ok: false, error: `slack returned ${res.status}` };
      return { ok: true };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  },
};
