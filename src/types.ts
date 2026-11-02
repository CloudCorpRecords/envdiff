/**
 * envdiff types.
 *
 * envdiff compares two environment descriptors — typically a
 * developer's local environment and a CI environment — and
 * reports where they differ: Node version, OS, which environment
 * variables exist on one side only, which shared variables hold
 * different values, and whether a lockfile is present.
 *
 * A descriptor is a JSON object:
 *
 *   {
 *     "node": "20.11.0",                  // optional string
 *     "os": "linux",                      // optional string
 *     "env": { "CI": "true", ... },       // optional string map
 *     "lockfile_present": true            // optional boolean
 *   }
 *
 * Values are compared but NEVER echoed into the report: the
 * report names the keys whose values differ, so a descriptor may
 * carry secrets without leaking them into the output.
 */

/** One side's environment descriptor, as accepted on input. */
export interface EnvDescriptor {
  node?: string;
  os?: string;
  env?: Record<string, string>;
  lockfile_present?: boolean;
}

/** A compared scalar field. */
export interface FieldDiff {
  local: string | boolean | null;
  ci: string | boolean | null;
  differs: boolean;
}

/** The full environment comparison report. */
export interface EnvDiffResult {
  node: FieldDiff;
  os: FieldDiff;
  lockfile_present: FieldDiff;
  env: {
    only_in_local: string[];
    only_in_ci: string[];
    /** Keys present on both sides whose values differ (values never echoed). */
    value_differences: string[];
  };
  summary: {
    /** Total differing items across all sections. */
    total_differences: number;
    differs: boolean;
  };
}
