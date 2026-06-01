const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const VERSION = "v1.3.0";

function sha256Text(text) {
  return crypto.createHash("sha256").update(Buffer.from(text, "utf8")).digest("hex");
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeJson(p, value) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, `${JSON.stringify(value, null, 2)}\n`);
}

function copyRepo(sourceRoot, targetRoot) {
  fs.cpSync(sourceRoot, targetRoot, {
    recursive: true,
    filter: (src) => {
      const rel = path.relative(sourceRoot, src);
      if (!rel) return true;
      const parts = rel.split(path.sep);
      if (parts.includes(".git")) return false;
      if (parts.includes("node_modules")) return false;
      if (parts.includes(".next")) return false;
      if (parts.includes("dist")) return false;
      if (parts.includes("coverage")) return false;
      return true;
    }
  });
}

function runAdmissionGenerator(worktree) {
  const result = spawnSync(process.execPath, ["scripts/generate-truth-frame-admission-gate.js"], {
    cwd: worktree,
    encoding: "utf8"
  });

  return {
    exit_code: result.status === null ? -1 : result.status,
    signal: result.signal || null,
    output: `${result.stdout || ""}${result.stderr || ""}`
  };
}

function scenarioRoot(name) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `truthframer-admission-refusal-${name}-`));
}

const SCENARIOS = [
  {
    id: "orphan_terminal_render",
    expected_token: "TERMINAL_RENDER_ORPHAN:tf-999999",
    mutate: (root) => {
      fs.copyFileSync(
        path.join(root, "apps/terminal/tf-000001.html"),
        path.join(root, "apps/terminal/tf-999999.html")
      );
    }
  },
  {
    id: "orphan_public_render",
    expected_token: "PUBLIC_RENDER_ORPHAN:tf-999998",
    mutate: (root) => {
      const dir = path.join(root, "docs/render/tf-999998");
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, "index.html"), "<!doctype html><title>tf-999998 orphan</title>\n");
    }
  },
  {
    id: "orphan_registry_entry",
    expected_token: "REGISTRY_ORPHAN:tf-999997",
    mutate: (root) => {
      const p = path.join(root, "registry/TRUTH_FRAME_REGISTRY.json");
      const json = readJson(p);
      json.admission_refusal_probe = "tf-999997";
      writeJson(p, json);
    }
  },
  {
    id: "orphan_spine_entry",
    expected_token: "SPINE_ORPHAN:tf-999996",
    mutate: (root) => {
      const p = path.join(root, "spine/TRUTH_FRAME_SYSTEM_SPINE.json");
      const json = readJson(p);
      json.frames = Array.isArray(json.frames) ? json.frames : [];
      json.frames.push({
        id: "tf-999996",
        admission_refusal_probe: true
      });
      writeJson(p, json);
    }
  },
  {
    id: "incomplete_canonical_case",
    expected_token: "REQUIRED_FILE_MISSING:tf-000005:cases/tf-000005-admission-refusal-probe/SOURCE_MANIFEST.json",
    mutate: (root) => {
      const dir = path.join(root, "cases/tf-000005-admission-refusal-probe");
      fs.mkdirSync(dir, { recursive: true });
      writeJson(path.join(dir, "TRUTH_FRAME.json"), {
        id: "tf_000005",
        frame_id: "tf-000005",
        admission_refusal_probe: true
      });
    }
  }
];

function runScenario(sourceRoot, scenario) {
  const tempParent = scenarioRoot(scenario.id);
  const worktree = path.join(tempParent, "worktree");

  try {
    copyRepo(sourceRoot, worktree);
    scenario.mutate(worktree);

    const run = runAdmissionGenerator(worktree);
    const observedFailure = run.exit_code !== 0;
    const expectedTokenPresent = run.output.includes(scenario.expected_token);

    return {
      id: scenario.id,
      expected_token: scenario.expected_token,
      observed_failure: observedFailure,
      expected_token_present: expectedTokenPresent,
      refusal_pass: observedFailure && expectedTokenPresent
    };
  } finally {
    fs.rmSync(tempParent, { recursive: true, force: true });
  }
}

function runRefusalHarness(sourceRoot = process.cwd()) {
  const scenarioResults = SCENARIOS.map((scenario) => runScenario(sourceRoot, scenario));
  const failed = scenarioResults.filter((scenario) => !scenario.refusal_pass);

  const core = {
    version: VERSION,
    status: failed.length === 0
      ? "TRUTH_FRAME_ADMISSION_REFUSAL_PROVEN"
      : "TRUTH_FRAME_ADMISSION_REFUSAL_PROOF_FAILED",
    primary_object: "truth_frame",
    proof_function: "adversarial_negative_control_refusal",
    refusal_boundary: "orphan_or_incomplete_truth_frame_materialization",
    scenario_count: scenarioResults.length,
    failed_scenario_count: failed.length,
    scenarios: scenarioResults,
    guarantees: [
      "An orphan terminal render is refused.",
      "An orphan public render is refused.",
      "An orphan registry entry is refused.",
      "An orphan spine entry is refused.",
      "An incomplete canonical case is refused.",
      "The refusal proof mutates only temporary worktrees."
    ]
  };

  return {
    ...core,
    proof_sha256: sha256Text(JSON.stringify(core, null, 2))
  };
}

module.exports = {
  VERSION,
  runRefusalHarness
};
