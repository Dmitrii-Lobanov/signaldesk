# Contributing

SignalDesk is currently a solo portfolio project, but it follows collaboration practices that make decisions and changes reviewable.

## Change workflow

1. Start with a user outcome or a clearly stated engineering risk.
2. Add acceptance criteria to an issue.
3. Record an ADR before introducing a material dependency or system boundary.
4. Keep changes small enough to review and demonstrate.
5. Include tests, documentation, and operational implications in the same change.

## Commit guidance

- Use imperative, outcome-oriented commit subjects.
- Do not combine unrelated cleanup with a product change.
- Never commit credentials, customer data, or generated local secrets.

## Pull-request checklist

- [ ] User outcome and scope are clear.
- [ ] Loading, empty, error, success, and permission states are covered.
- [ ] Keyboard and accessibility behavior are verified.
- [ ] Authorization and tenant boundaries have negative tests.
- [ ] Types, tests, lint, and build pass.
- [ ] Observability and failure recovery are addressed.
- [ ] Relevant documentation or ADRs are updated.
