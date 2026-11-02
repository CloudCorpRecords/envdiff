# Changelog

## 0.1.0 (2026-10-27)

- Initial release: `diff_environments` MCP tool and `diff` CLI
  command comparing two environment descriptors (Node version,
  OS, lockfile presence, env var key sets).
- Env values are compared but never echoed: the report names
  only the keys whose values differ.
