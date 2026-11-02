import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { diffEnvironments } from "../src/envdiff.js";

/**
 * All tests are pure local computation over inline descriptors:
 * no filesystem, no network. The no-echo rule is pinned by the
 * value_differences test: the report must name keys only.
 */

const LOCAL = {
  node: "20.11.0",
  os: "darwin",
  env: { PATH: "/usr/bin", API_KEY: "local-secret", SHARED: "same" },
  lockfile_present: true,
};
const CI = {
  node: "20.11.0",
  os: "linux",
  env: { PATH: "/usr/bin", CI: "true", SHARED: "same", API_KEY: "ci-secret" },
  lockfile_present: true,
};

describe("diffEnvironments", () => {
  it("reports identical descriptors as no difference", () => {
    const out = diffEnvironments(LOCAL, structuredClone(LOCAL));
    assert.equal(out.summary.differs, false);
    assert.equal(out.summary.total_differences, 0);
    assert.deepEqual(out.env, { only_in_local: [], only_in_ci: [], value_differences: [] });
  });

  it("compares node, os, and lockfile presence as fields", () => {
    const out = diffEnvironments(LOCAL, CI);
    assert.deepEqual(out.node, { local: "20.11.0", ci: "20.11.0", differs: false });
    assert.deepEqual(out.os, { local: "darwin", ci: "linux", differs: true });
    assert.deepEqual(out.lockfile_present, { local: true, ci: true, differs: false });
  });

  it("splits env keys into only-in-local, only-in-ci, and value differences", () => {
    const out = diffEnvironments(LOCAL, CI);
    assert.deepEqual(out.env.only_in_local, []);
    assert.deepEqual(out.env.only_in_ci, ["CI"]);
    assert.deepEqual(out.env.value_differences, ["API_KEY"]);
    assert.equal(out.summary.total_differences, 3);
  });

  it("never echoes env values into the report", () => {
    const out = diffEnvironments(LOCAL, CI);
    const rendered = JSON.stringify(out);
    assert.equal(rendered.includes("local-secret"), false);
    assert.equal(rendered.includes("ci-secret"), false);
  });

  it("treats a missing field as null, differing from any present value", () => {
    const out = diffEnvironments({ node: "22.0.0" }, {});
    assert.deepEqual(out.node, { local: "22.0.0", ci: null, differs: true });
    assert.deepEqual(out.os, { local: null, ci: null, differs: false });
    assert.equal(out.summary.total_differences, 1);
  });

  it("counts every differing section in the summary", () => {
    const out = diffEnvironments(
      { node: "18.0.0", os: "win32", env: { A: "1", B: "2" }, lockfile_present: false },
      { node: "20.0.0", os: "linux", env: { A: "9", C: "3" }, lockfile_present: true },
    );
    // node + os + lockfile + only_in_local(B) + only_in_ci(C) + value_diff(A) = 6
    assert.equal(out.summary.total_differences, 6);
    assert.equal(out.summary.differs, true);
  });

  it("sorts the env key lists", () => {
    const out = diffEnvironments({ env: { Z: "1", M: "1" } }, { env: { Y: "1", A: "1" } });
    assert.deepEqual(out.env.only_in_local, ["M", "Z"]);
    assert.deepEqual(out.env.only_in_ci, ["A", "Y"]);
  });
});

describe("diffEnvironments — input validation", () => {
  it("rejects non-object descriptors, naming the side", () => {
    assert.throws(() => diffEnvironments("nope", {}), /local must be an environment descriptor object/);
    assert.throws(() => diffEnvironments({}, null), /ci must be an environment descriptor object/);
  });

  it("rejects wrongly-typed fields, naming side and field", () => {
    assert.throws(() => diffEnvironments({ node: 20 }, {}), /local\.node must be a string/);
    assert.throws(() => diffEnvironments({}, { env: { A: 1 } }), /ci\.env\.A must be a string/);
    assert.throws(() => diffEnvironments({ lockfile_present: "yes" }, {}), /local\.lockfile_present must be a boolean/);
    assert.throws(() => diffEnvironments({ env: [] }, {}), /local\.env must be an object/);
  });
});
