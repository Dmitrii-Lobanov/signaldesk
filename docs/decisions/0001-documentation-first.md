# ADR 0001: Start with product and architecture documentation

- Status: accepted
- Date: 2026-08-13

## Context

SignalDesk has two goals: solve a coherent product problem and provide credible evidence of end-to-end product-engineering ownership. Starting with framework setup would make it easy to accumulate features without a clear user workflow or evaluation standard.

## Decision

Define the product promise, MVP boundary, core data model, staged architecture, quality bar, and ten-week learning plan before implementation. Treat these documents as hypotheses that must evolve with evidence.

## Alternatives considered

- **Start from a full-stack template:** faster visible code, but key product and architectural decisions would be inherited rather than demonstrated.
- **Write exhaustive specifications:** more detail, but high risk of false certainty and delayed learning.

## Consequences

- Implementation starts with a narrower, testable vertical slice.
- Portfolio claims have explicit standards and planned evidence.
- Documentation must be updated when implementation disproves an assumption.

## Validation

The approach is useful if the first vertical slice can be scoped and reviewed from these documents without inventing major requirements during coding.
