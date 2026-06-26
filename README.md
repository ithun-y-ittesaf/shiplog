# Shiplog PM (starter)

An open-source, self-hostable "ship announcement" fan-out tool for PMs.
Pulls together what shipped (from GitHub, a ticket tracker, or a manual
entry), applies your team's own filtering/approval rules, and fans the
announcement out to Slack, email, and whatever else you plug in.

This repo is a working Phase 0 skeleton: **manual trigger → Slack/email**,
end to end. No database wiring yet, no GitHub/Jira connectors yet — those
are next. The point of this slice is to prove the pipeline shape before you
invest in the harder integrations.

## Architecture in one sentence

`Trigger → Source connector → Mapping rules → Draft → Approval gate (optional) → Fan-out queue → Destination connectors`

Every box in that sentence is a plugin behind a small interface
(`SourceConnector` / `DestinationConnector` in `packages/core`). Adding a new
source or destination means writing a connector — the pipeline in
`packages/core/src/pipeline.ts` never changes.

## Project layout

```
apps/
  web/                  Next.js app — UI + API routes
packages/
  core/                 Domain types, connector interfaces, pipeline engine
  db/                   Drizzle schema (Postgres) — persisted form of core types
  connectors-manual/    Source: PM types up a ship manually
  connectors-slack/     Destination: Slack incoming webhook
  connectors-email/     Destination: email via Resend's HTTP API
```

## Setup

```bash
pnpm install
cp .env.example .env       # fill in SLACK_WEBHOOK_URL to actually see a message land
pnpm dev:web
```

Then trigger a manual ship:

```bash
curl -X POST http://localhost:3000/api/ship \
  -H "Content-Type: application/json" \
  -d '{"items":[{"kind":"feature","title":"Dark mode shipped"}]}'
```

You should get back a `ShipmentRun` JSON object, and (if `SLACK_WEBHOOK_URL`
is set) a message in Slack.

Postgres is there for when you're ready to wire up `packages/db`:

```bash
docker compose up -d
pnpm db:push
```

## Roadmap

- **Phase 0 (this repo)** — manual trigger, Slack + email, in-memory config.
  Get the loop working end to end.
- **Phase 1** — GitHub connector (the flashy one), wire `packages/db` in for
  real mapping rules and destinations, add the approval gate for real,
  move execution onto a job queue (e.g. `pg-boss`) so destination sends can
  retry independently and webhooks don't block on slow APIs.
- **Phase 2** — Jira/Linear connector, a UI for editing mapping rules and
  templates per workspace (this is the actual "different companies,
  different processes" interface — most PMs won't want to write JSON/YAML).
- **Phase 3** — Twitter/X, in-app banner, Notion/Confluence destinations;
  connector SDK docs so the community can contribute new ones without
  touching `packages/core`.
- **Phase 4 (optional)** — hosted multi-tenant layer on top of the same
  core, if you go the "open core" route.

## Notes

- Workspace packages (`@shiplog/core`, etc.) are shipped as raw TypeScript
  source, no build step — `transpilePackages` in `next.config.js` handles
  that for the web app. Fine for now; add a real build (`tsup`) once a
  connector needs to run outside of Next (e.g. a standalone worker).
- Secrets (Slack webhook URLs, API keys) currently live in `.env` per
  instance. Before this becomes multi-workspace, that needs to move to an
  encrypted `secrets` table — don't skip that when you get there.
# shiplog
