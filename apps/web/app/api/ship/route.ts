import { NextResponse } from "next/server";
import { runPipeline, type PipelineDeps } from "@shiplog/core";
import { manualConnector } from "@shiplog/connectors-manual";
import { slackConnector } from "@shiplog/connectors-slack";
import { emailConnector } from "@shiplog/connectors-email";

// TODO: once packages/db is wired up, replace these in-memory stubs with
// real lookups against the mapping_rules / destinations tables -- that's
// the actual "different companies, different config" switch. Hardcoded
// here so the loop is runnable on day one with zero database setup.
const deps: PipelineDeps = {
  sourceConnectors: { manual: manualConnector },
  destinationConnectors: { slack: slackConnector, email: emailConnector },
  getMappingRules: async () => [],
  getDestinations: async (workspaceId) => [
    {
      id: "slack-default",
      workspaceId,
      type: "slack",
      enabled: Boolean(process.env.SLACK_WEBHOOK_URL),
      template: "{{summary}}",
      settings: { webhookUrl: process.env.SLACK_WEBHOOK_URL },
    },
  ],
  renderTemplate: (_template, items) =>
    items.map((i) => `\u2022 ${i.title}`).join("\n") || "No items in this ship.",
  requiresApproval: async () => false,
};

export async function POST(req: Request) {
  const body = await req.json();

  const trigger = {
    id: crypto.randomUUID(),
    workspaceId: "demo-workspace",
    type: "manual" as const,
    sourceRef: "manual",
    firedAt: new Date().toISOString(),
    raw: body,
  };

  const run = await runPipeline(trigger, deps);
  return NextResponse.json(run);
}
