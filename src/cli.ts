#!/usr/bin/env node
/**
 * envdiff CLI.
 *
 *   envdiff diff <local.json> <ci.json>
 *   envdiff mcp
 *
 * Both arguments are paths to JSON environment descriptor
 * files. Pure local computation: no network, no configuration.
 * Argument validation happens before any file is read.
 * Exit codes: 0 success, 1 runtime error (including an
 * unreadable or invalid descriptor), 2 usage error.
 */
import { readFileSync } from "node:fs";
import { diffEnvironments, formatPayload, VERSION } from "./envdiff.js";

function usage(): never {
  console.error(`Usage:
  envdiff diff <local.json> <ci.json>
  envdiff mcp
  envdiff --version

A descriptor is a JSON object: {node?, os?, env?, lockfile_present?}.`);
  process.exit(2);
}

function readDescriptor(path: string, label: string): unknown {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch (err) {
    console.error(
      `error: cannot read ${label} file '${path}': ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error(
      `error: ${label} file '${path}' is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const [cmd, ...rest] = process.argv.slice(2);
  if (cmd === "--version" || cmd === "-v") {
    console.log(VERSION);
    return;
  }
  if (cmd === "mcp") {
    await import("./mcp.js");
    return;
  }
  if (cmd !== "diff" || rest.length !== 2) usage();

  const local = readDescriptor(rest[0], "local");
  const ci = readDescriptor(rest[1], "ci");
  try {
    const out = diffEnvironments(local, ci);
    console.log(formatPayload(out));
  } catch (err) {
    console.error(`error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

void main();
