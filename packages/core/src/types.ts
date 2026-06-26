// The shared vocabulary every connector and every company's config speaks.
// Nothing here is GitHub-specific or Slack-specific on purpose -- that's
// what makes the same pipeline work for a team that ships via Jira tickets
// and Discord just as well as one that ships via GitHub releases and Slack.

export type TriggerType =
  | "github_release"
  | "github_merge"
  | "ticket_status"
  | "manual"
  | "scheduled";

export interface TriggerEvent {
  id: string;
  workspaceId: string;
  type: TriggerType;
  sourceRef: string; // git tag, ticket id, or "manual"
  firedAt: string; // ISO timestamp
  raw: unknown; // original webhook body / form payload, untouched
}

export type ContentKind = "feature" | "fix" | "improvement" | "breaking" | "chore" | "other";

export interface ContentItem {
  id: string;
  triggerEventId: string;
  kind: ContentKind;
  title: string;
  description?: string;
  link?: string;
  include: boolean; // flipped by mapping rules below
  audience?: "internal" | "customer" | "both";
}

// This is the per-company configurability surface. A scrappy startup might
// have zero rules (include everything). A larger org might hide "chore",
// merge "fix" + "perf" into one bucket, and mark breaking changes
// internal-only until a migration guide is ready.
export interface MappingRule {
  id: string;
  workspaceId: string;
  match: { kindIn?: ContentKind[]; titleMatches?: string };
  action: { include: boolean; relabelKind?: ContentKind; audience?: ContentItem["audience"] };
}

export interface Draft {
  id: string;
  triggerEventId: string;
  channelVariants: Record<string, string>; // destinationId -> rendered text
  status: "pending" | "needs_approval" | "approved" | "rejected";
}

// Another configurability axis: some teams auto-send, some need a single
// approver, some need a quorum before anything goes external.
export interface ApprovalConfig {
  required: boolean;
  approverIds?: string[];
  minApprovals?: number;
}

export interface DestinationConfig {
  id: string;
  workspaceId: string;
  type: "slack" | "email" | "twitter" | "in_app_banner" | "jira_update" | "notion_doc" | "webhook";
  enabled: boolean;
  template: string;
  settings: Record<string, unknown>; // connector-specific: webhook URL, channel, etc.
}

export interface ShipmentRun {
  id: string;
  triggerEventId: string;
  startedAt: string;
  finishedAt?: string;
  results: Array<{ destinationId: string; status: "sent" | "failed" | "skipped"; error?: string }>;
}
