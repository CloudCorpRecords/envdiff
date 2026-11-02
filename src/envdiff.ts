/**
 * envdiff core: local-vs-CI environment comparison.
 *
 *   diffEnvironments(local, ci) -> EnvDiffResult
 *
 * Each descriptor may carry `node` and `os` strings, an `env`
 * string map, and a `lockfile_present` boolean; every field is
 * optional and a missing field is reported as null (and differs
 * from any present value on the other side).
 *
 * The env section reports key sets: keys only on one side, and
 * keys on both sides whose values differ. Values themselves are
 * never copied into the report — only key names — so descriptors
 * can carry secrets safely.
 *
 * An input that is not a JSON object, or a field of the wrong
 * kind (e.g. `env` not a string map), is an error naming the
 * side and field — never a fabricated "identical".
 */
import type { EnvDescriptor, EnvDiffResult, FieldDiff } from "./types.js";

export const VERSION = "0.1.0";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseDescriptor(value: unknown, side: string): EnvDescriptor {
  if (!isRecord(value)) {
    throw new Error(`${side} must be an environment descriptor object`);
  }
  const out: EnvDescriptor = {};
  if (value.node !== undefined) {
    if (typeof value.node !== "string") throw new Error(`${side}.node must be a string`);
    out.node = value.node;
  }
  if (value.os !== undefined) {
    if (typeof value.os !== "string") throw new Error(`${side}.os must be a string`);
    out.os = value.os;
  }
  if (value.env !== undefined) {
    if (!isRecord(value.env)) throw new Error(`${side}.env must be an object of string values`);
    const env: Record<string, string> = {};
    for (const [key, raw] of Object.entries(value.env)) {
      if (typeof raw !== "string") throw new Error(`${side}.env.${key} must be a string`);
      env[key] = raw;
    }
    out.env = env;
  }
  if (value.lockfile_present !== undefined) {
    if (typeof value.lockfile_present !== "boolean") {
      throw new Error(`${side}.lockfile_present must be a boolean`);
    }
    out.lockfile_present = value.lockfile_present;
  }
  return out;
}

function fieldDiff(
  local: string | boolean | undefined,
  ci: string | boolean | undefined,
): FieldDiff {
  const l = local ?? null;
  const c = ci ?? null;
  return { local: l, ci: c, differs: l !== c };
}

/** Compare two environment descriptors. */
export function diffEnvironments(local: unknown, ci: unknown): EnvDiffResult {
  const l = parseDescriptor(local, "local");
  const c = parseDescriptor(ci, "ci");

  const node = fieldDiff(l.node, c.node);
  const os = fieldDiff(l.os, c.os);
  const lockfile = fieldDiff(l.lockfile_present, c.lockfile_present);

  const lEnv = l.env ?? {};
  const cEnv = c.env ?? {};
  const onlyInLocal = Object.keys(lEnv).filter((k) => !(k in cEnv)).sort();
  const onlyInCi = Object.keys(cEnv).filter((k) => !(k in lEnv)).sort();
  const valueDifferences = Object.keys(lEnv)
    .filter((k) => k in cEnv && lEnv[k] !== cEnv[k])
    .sort();

  const total =
    (node.differs ? 1 : 0) +
    (os.differs ? 1 : 0) +
    (lockfile.differs ? 1 : 0) +
    onlyInLocal.length +
    onlyInCi.length +
    valueDifferences.length;

  return {
    node,
    os,
    lockfile_present: lockfile,
    env: {
      only_in_local: onlyInLocal,
      only_in_ci: onlyInCi,
      value_differences: valueDifferences,
    },
    summary: { total_differences: total, differs: total > 0 },
  };
}

/** Render a payload as the JSON text block MCP clients show. */
export function formatPayload(payload: unknown): string {
  return typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
}
