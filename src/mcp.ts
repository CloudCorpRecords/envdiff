/**
 * envdiff MCP server. Tools: diff_environments.
 *
 * Why the low-level Server instead of McpServer: the high-level
 * helper converts zod schemas to JSON Schema and injects keys
 * not in this tool's defined spec ("$schema" and
 * "additionalProperties"), which breaks exact tool-list/schema
 * parity with the spec. This file serves tools/list with the
 * spec's exact input schemas as explicit literals, while zod
 * still validates every tools/call argument set.
 *
 * The comparison is pure local computation: no upstream API, no
 * authentication, no configuration.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { diffEnvironments, formatPayload, VERSION } from "./envdiff.js";

const Descriptor = z.object({
  node: z.string().optional(),
  os: z.string().optional(),
  env: z.record(z.string()).optional(),
  lockfile_present: z.boolean().optional(),
});

const DiffArgs = z.object({
  local: Descriptor,
  ci: Descriptor,
});

const DESCRIPTOR_SCHEMA = {
  type: "object" as const,
  properties: {
    node: { type: "string", description: "Node.js version string" },
    os: { type: "string", description: "Operating system identifier" },
    env: {
      type: "object",
      description: "Environment variables as a string map (values are compared, never echoed)",
    },
    lockfile_present: { type: "boolean", description: "Whether a lockfile is present" },
  },
};

const TOOLS = [
  {
    name: "diff_environments",
    description:
      "Compare two environment descriptors (local vs CI) and report where they differ: Node version, OS, lockfile presence, env vars present on one side only, and env vars whose values differ (keys named, values never echoed).",
    inputSchema: {
      type: "object" as const,
      properties: {
        local: { ...DESCRIPTOR_SCHEMA, description: "The local environment descriptor" },
        ci: { ...DESCRIPTOR_SCHEMA, description: "The CI environment descriptor" },
      },
      required: ["local", "ci"],
    },
  },
];

function textResult(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: typeof value === "string" ? value : JSON.stringify(value, null, 2),
      },
    ],
  };
}

function errorResult(err: unknown) {
  return {
    content: [
      { type: "text" as const, text: err instanceof Error ? err.message : String(err) },
    ],
    isError: true,
  };
}

const server = new Server(
  { name: "envdiff", version: VERSION },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    let out: unknown;
    if (name === "diff_environments") {
      const parsed = DiffArgs.parse(args ?? {});
      out = diffEnvironments(parsed.local, parsed.ci);
    } else {
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
    return textResult(formatPayload(out));
  } catch (err) {
    if (err instanceof McpError) throw err;
    return errorResult(err);
  }
});

async function main(): Promise<void> {
  await server.connect(new StdioServerTransport());
}

void main();
