import type { SourceConnector, TriggerEvent, ContentItem } from "@shiplog/core";

// Manual entries don't fetch anything from an external API -- the PM types
// the content directly into the trigger payload when they hit "ship". This
// connector just validates the shape and passes it through to the pipeline.
export const manualConnector: SourceConnector = {
  type: "manual",
  async fetchContent(trigger: TriggerEvent): Promise<ContentItem[]> {
    const payload = trigger.raw as { items?: Partial<ContentItem>[] };
    return (payload.items ?? []).map((item, i) => ({
      id: `${trigger.id}-${i}`,
      triggerEventId: trigger.id,
      kind: item.kind ?? "other",
      title: item.title ?? "Untitled",
      description: item.description,
      link: item.link,
      include: true,
      audience: item.audience ?? "customer",
    }));
  },
};
