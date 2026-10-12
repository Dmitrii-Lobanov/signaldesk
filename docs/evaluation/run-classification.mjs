import { appendFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { ClassificationSuggestionAdapter } from "../../apps/api/dist/feedback/classification-suggestion.adapter.js";

const split = process.argv[2];
if (split !== "tuning" && split !== "held-out") {
  throw new Error(
    "Use: node docs/evaluation/run-classification.mjs tuning|held-out",
  );
}
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is required");
}

const inputPath = new URL(`./${split}.jsonl`, import.meta.url);
const outputPath = new URL(`./${split}-results.jsonl`, import.meta.url);
if (existsSync(outputPath)) {
  throw new Error(`Results already exist: ${outputPath.pathname}`);
}

const cases = (await readFile(inputPath, "utf8"))
  .trim()
  .split("\n")
  .map((line) => JSON.parse(line));

const areas = [
  { id: "33333333-3333-4333-8333-333333333333", name: "Navigation" },
  { id: "44444444-4444-4444-8444-444444444444", name: "Reporting" },
];
const tags = [
  { id: "55555555-5555-4555-8555-555555555555", name: "Usability" },
  { id: "66666666-6666-4666-8666-666666666666", name: "Export" },
];
const areaName = new Map(areas.map(({ id, name }) => [id, name]));
const tagName = new Map(tags.map(({ id, name }) => [id, name]));
const adapter = new ClassificationSuggestionAdapter();

let correctAreas = 0;
let truePositive = 0;
let falsePositive = 0;
let falseNegative = 0;
let failures = 0;
let totalLatencyMs = 0;
let knownCostUsd = 0;
let unknownCostCount = 0;

for (const item of cases) {
  const started = performance.now();
  let predictedArea = null;
  let predictedTags = [];
  let result;

  try {
    const suggestion = await adapter.suggest(item.text, 1, areas, tags);
    predictedArea = suggestion.productAreaId
      ? areaName.get(suggestion.productAreaId)
      : null;
    predictedTags = suggestion.tagIds.map((id) => tagName.get(id));

    result = {
      id: item.id,
      status: "ok",
      expectedArea: item.area,
      predictedArea,
      expectedTags: item.tags,
      predictedTags,
      model: suggestion.model,
      promptVersion: suggestion.promptVersion,
      latencyMs: suggestion.latencyMs,
      inputTokens: suggestion.inputTokens,
      outputTokens: suggestion.outputTokens,
      estimatedCostUsd: suggestion.estimatedCostUsd,
    };

    if (suggestion.estimatedCostUsd === null) unknownCostCount += 1;
    else knownCostUsd += suggestion.estimatedCostUsd;
  } catch (error) {
    failures += 1;
    unknownCostCount += 1;
    result = {
      id: item.id,
      status: "failed",
      expectedArea: item.area,
      predictedArea: null,
      expectedTags: item.tags,
      predictedTags: [],
      error: error instanceof Error ? error.name : "Unknown error",
      latencyMs: Math.round(performance.now() - started),
    };
  }

  totalLatencyMs += result.latencyMs;
  if (result.status === "ok" && predictedArea === item.area) {
    correctAreas += 1;
  }

  const expected = new Set(item.tags);
  const predicted = new Set(predictedTags);
  for (const tag of predicted) {
    if (expected.has(tag)) truePositive += 1;
    else falsePositive += 1;
  }
  for (const tag of expected) {
    if (!predicted.has(tag)) falseNegative += 1;
  }

  await appendFile(outputPath, `${JSON.stringify(result)}\n`);
  console.log(`${item.id}: ${result.status}`);

  // Keep the small evaluation gentle on the free quota.
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

console.log(
  JSON.stringify(
    {
      split,
      cases: cases.length,
      failures,
      productAreaAccuracy: correctAreas / cases.length,
      tagPrecision:
        truePositive + falsePositive
          ? truePositive / (truePositive + falsePositive)
          : null,
      tagRecall:
        truePositive + falseNegative
          ? truePositive / (truePositive + falseNegative)
          : null,
      averageLatencyMs: Math.round(totalLatencyMs / cases.length),
      knownEstimatedCostUsd: knownCostUsd,
      unknownCostCount,
    },
    null,
    2,
  ),
);
