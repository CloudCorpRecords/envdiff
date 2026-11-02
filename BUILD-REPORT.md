# envdiff — Build Report

MCP Rebuild 1000 (Tranche #101+ Batch 10). **Original build**
from the program's own packages-100 plan
(`~/workspace/packages-100/100-packages-plan.md`, cluster B
#17: "Local vs CI differ: node, env vars present/absent, OS,
lockfile state"), NOT a rebuild of an external server. The tool
surface is the program's defined spec, recorded in
`harness/fixtures/envdiff-tools-original.json` with its
`_source` labelled "program spec". Local build only — nothing
pushed or published.

Identity: repo `envdiff`, npm `@reneturcios/envdiff`,
MCP name `io.github.CloudCorpRecords/envdiff`, version `0.1.0`,
bin `envdiff` → `dist/cli.js`.

## Files created (19/19 per TEMPLATE.md checklist)

- `package.json`, `server.json` (description "Diff local vs CI
  environments: Node, OS, lockfile, and env vars — keys named,
  values never echoed.", ≤100 chars; npm entry carries
  `version: 0.1.0`; OCI entry `ghcr.io/cloudcorprecords/envdiff:0.1.0`
  carries **no** `version` field), `Dockerfile` (node:20-alpine
  two-stage, label `io.modelcontextprotocol.server.name="io.github.CloudCorpRecords/envdiff"`),
  `tsconfig.json`, `.gitignore`, `LICENSE` (MIT, Copyright (c)
  2026 Rene Turcios), `README.md` (fresh text), `CHANGELOG.md`
  (single 0.1.0 entry, 2026-10-27)
- `src/index.ts`, `src/cli.ts` (`diff <local.json> <ci.json>`,
  `mcp`, `--version`; exit 2 usage / 1 runtime error, argument
  validation before any file is read), `src/mcp.ts`,
  `src/types.ts`, `src/envdiff.ts` (core, `VERSION = "0.1.0"`)
- `test/envdiff.test.ts`
- `.github/workflows/{ci,publish,publish-container,registry-publish}.yml`

## Tools implemented (1)

- `diff_environments` — `local`, `ci` (objects, required):
  environment descriptors `{node?, os?, env?, lockfile_present?}`,
  every field optional.

## Implementation notes

- `src/mcp.ts` uses the SDK's low-level `Server` with explicit
  inputSchema literals exactly matching the fixture, per the
  standing fleet rule; zod still validates every `tools/call`.
- Env values are compared but **never echoed**: the report
  names only the keys that differ, so descriptors may carry
  secrets. This rule is pinned by a dedicated test that renders
  the whole report and asserts neither side's secret value
  appears in it.
- Missing fields compare as null (a field present on one side
  only is a difference). Key lists are sorted. Pure local
  computation: no network, no configuration.

## Verification (foreground, coordinator re-run)

- `tsc --noEmit` exit 0; `npm run build` exit 0 (`dist/cli.js`)
- `npm test`: **9 tests, 9 pass, 0 fail** — identical
  descriptors, field comparisons, env key-set split, the
  no-echo rule, missing-field nulls, full summary counting,
  sorted key lists, side/field-naming validation errors
- `dist/cli.js --version` → `0.1.0`
- Parity: `harness/parity.py` vs
  `harness/fixtures/envdiff-tools-original.json` →
  **PASS, parity 100.0, identical_tools 1/1** (program-spec
  fixture)

## Lockfile status

`package-lock.json` generated clean via Route 3 (temp copy with
only `package.json`, offline `npm install --package-lock-only
--ignore-scripts --offline`), verified: parses, name
`@reneturcios/envdiff`, **128 package entries**. Local
`node_modules` is a symlink to the sibling burnmeter tree;
gitignored.

## Gaps / honest notes

- Program-spec build: descriptor shape and diff semantics are
  this program's definitions, recorded in the fixture's
  `_source`. envdiff does not *collect* a descriptor from the
  machine it runs on — collection is the caller's side; the
  tool compares what it is given. Recorded, not hidden.
- Container build not exercised locally; the publish-container
  workflow smoke-tests the image at publish time.
