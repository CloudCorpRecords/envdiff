# envdiff

"It works on my machine" — which part of the machine? envdiff
compares two environment descriptors, typically a developer's
local environment and a CI environment, and reports exactly
where they differ:

- **Node version**, **OS**, and **lockfile presence**, compared
  as fields (a missing field is reported as `null`)
- **env vars present on one side only**, by key
- **env vars whose values differ** — by key name only. Values
  are compared but **never echoed** into the report, so a
  descriptor may carry secrets without leaking them.

A descriptor is a small JSON object:
`{"node": "20.11.0", "os": "linux", "env": {"CI": "true"}, "lockfile_present": true}`
— every field optional.

Pure local computation: no network, no configuration.

## CLI

```bash
npx @reneturcios/envdiff diff local.json ci.json
npx @reneturcios/envdiff --version
```

Output is the comparison report as JSON, with a
`summary.total_differences` count. Exit codes: `0` on success
(differences are a *result*, not an error), `1` on a runtime
error (unreadable or invalid descriptor), `2` on a usage error.

## MCP server

```bash
npx -y @reneturcios/envdiff mcp
```

MCP client config:

```json
{
  "mcpServers": {
    "envdiff": {
      "command": "npx",
      "args": ["-y", "@reneturcios/envdiff", "mcp"]
    }
  }
}
```

### Tools

- `diff_environments` — Compare two environment descriptors.
  - `local` (object, required) — the local descriptor
  - `ci` (object, required) — the CI descriptor

  Each descriptor: `node` (string), `os` (string), `env`
  (string map), `lockfile_present` (boolean), all optional.

## Docker

```bash
docker run -i ghcr.io/cloudcorprecords/envdiff
docker run --rm -v "$PWD:/w" ghcr.io/cloudcorprecords/envdiff diff /w/local.json /w/ci.json
```

## Development

```bash
npm install
npm run build   # tsc -> dist/
npm test        # tsx --test test/*.test.ts (pure local, no network)
npm run dev     # run the CLI from source
```

## License

MIT — Copyright (c) 2026 Rene Turcios
