import type {
  TriggerEvent,
  ContentItem,
  MappingRule,
  DestinationConfig,
  ShipmentRun,
} from "./types.js";
import type { SourceConnector, DestinationConnector } from "./connector.js";

// Everything the pipeline needs from the outside world, injected. Swap any
// of these (a real Postgres-backed lookup instead of the in-memory stub in
// apps/web, an LLM-assisted renderTemplate, etc.) without touching the
// orchestration logic below.
export interface PipelineDeps {
  sourceConnectors: Record<string, SourceConnector>;
  destinationConnectors: Record<string, DestinationConnector>;
  getMappingRules: (workspaceId: string) => Promise<MappingRule[]>;
  getDestinations: (workspaceId: string) => Promise<DestinationConfig[]>;
  renderTemplate: (template: string, items: ContentItem[]) => string;
  requiresApproval: (workspaceId: string) => Promise<boolean>;
}

export function applyMappingRules(items: ContentItem[], rules: MappingRule[]): ContentItem[] {
  return items.map((item) => {
    const rule = rules.find((r) => r.match.kindIn?.includes(item.kind));
    if (!rule) return item;
    return {
      ...item,
      include: rule.action.include,
      kind: rule.action.relabelKind ?? item.kind,
      audience: rule.action.audience ?? item.audience,
    };
  });
}

export async function runPipeline(trigger: TriggerEvent, deps: PipelineDeps): Promise<ShipmentRun> {
  const connector = deps.sourceConnectors[trigger.type];
  if (!connector) {
    throw new Error(`No source connector registered for trigger type "${trigger.type}"`);
  }

  const rawItems = await connector.fetchContent(trigger);
  const rules = await deps.getMappingRules(trigger.workspaceId);
  const items = applyMappingRules(rawItems, rules).filter((i) => i.include);

  const destinations = await deps.getDestinations(trigger.workspaceId);
  const needsApproval = await deps.requiresApproval(trigger.workspaceId);

  const run: ShipmentRun = {
    id: crypto.randomUUID(),
    triggerEventId: trigger.id,
    startedAt: new Date().toISOString(),
    results: [],
  };

  if (needsApproval) {
    // Phase 0 stub: stop here. Once you add real persistence, this is where
    // you'd save the draft with status "needs_approval" and let a separate
    // approval flow call fanOut() once someone signs off.
    return run;
  }

  return fanOut(run, items, destinations, deps);
}

export async function fanOut(
  run: ShipmentRun,
  items: ContentItem[],
  destinations: DestinationConfig[],
  deps: PipelineDeps
): Promise<ShipmentRun> {
  for (const destination of destinations.filter((d) => d.enabled)) {
    const connector = deps.destinationConnectors[destination.type];
    if (!connector) {
      run.results.push({ destinationId: destination.id, status: "failed", error: "no connector registered" });
      continue;
    }
    const text = deps.renderTemplate(destination.template, items);
    const result = await connector.send(text, destination);
    run.results.push({
      destinationId: destination.id,
      status: result.ok ? "sent" : "failed",
      error: result.error,
    });
  }
  run.finishedAt = new Date().toISOString();
  return run;
}
