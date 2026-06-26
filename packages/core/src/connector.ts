import type { TriggerEvent, ContentItem, DestinationConfig } from "./types.js";

// Every "source" -- GitHub, a ticket tracker, a manual form -- implements
// this one interface. Adding a new source means writing a connector, never
// touching the pipeline.
export interface SourceConnector {
  type: string;
  fetchContent(trigger: TriggerEvent): Promise<ContentItem[]>;
}

// Same idea for the fan-out side: Slack, email, Twitter/X, whatever's next.
export interface DestinationConnector {
  type: DestinationConfig["type"];
  send(renderedText: string, destination: DestinationConfig): Promise<{ ok: boolean; error?: string }>;
}
