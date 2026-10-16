# AI-assisted development examples

These examples summarize the development conversation and committed work.
They are not verbatim prompt transcripts or independently measured
productivity improvements.

## Example 1: capture-error accessibility and browser verification

### Task and context

Improve keyboard recovery when an editor submits empty feedback.
Preserve the existing retry-safe creation behavior and entered text.

### Agent contribution

The agent proposed returning focus to the textarea and exposing the error
through aria-invalid and aria-describedby. It also supplied browser
assertions for keyboard submission and correction.

Implementation: commit 7fa176c.
Keyboard regression: commit 312f71d.

### Error and correction

The first edited regression retained an old mouse click after the new
Enter submission. The first submission saved successfully and cleared the
field; the extra click submitted empty content and replaced the success
message with validation failure.

The saved failure context exposed the duplicate interaction. The redundant
click was removed, and the regression passed.

### Verification and explanation

The browser checked focus return, accessible error description, error-state
clearing, and successful keyboard capture.

A developer should be able to explain why an alert alone does not associate
an error with its field, and why a test must distinguish duplicate user
actions from duplicate network delivery.

Independent explanation proficiency was not separately recorded.

## Example 2: stale form versions after same-page changes

### Task and context

Extend the critical journey to manually classify edited feedback and
verify persistence, audit snapshots, and viewer restrictions.

### Agent contribution

The agent supplied isolated classification fixtures and browser assertions.
The new journey exposed classification saving with an outdated version
after a text edit refreshed server-rendered data.

The agent then proposed refreshing untouched form state while preserving
drafts and their original versions. The edit form received a corresponding
fix for classification-to-edit transitions.

Browser coverage: commit f496585.
Classification fix: commit ca34761.
Edit-form fix: commit 4c0349d.

### Error and correction

The initial test assumed router refresh would synchronize state initialized
from props. It did not: useState initialization does not rerun whenever
props change.

An explicit reload temporarily established classification behavior from a
fresh record. It was not treated as a fix for the same-page problem.
The reload workaround was subsequently removed to exercise the real fix.

### Verification and explanation

The browser journey verified same-page classification, persisted choices,
transactional audit snapshots, and viewer restrictions. It also checked
unchanged editing after classification without an extra edit audit event.
The existing second-tab stale-edit rejection remained covered.

A developer should be able to explain the difference between server props,
local draft state, and the version authorizing a write. Automatically
rebasing a modified draft would weaken stale-write protection.

The complete matrix of concurrent refreshes and dirty drafts was not
independently exhaustively verified.

## Ownership and limitations

The developer applied source edits and made commits. The agent helped
inspect code, propose changes, diagnose failures, and run checks.

These examples demonstrate contributions and corrections. They do not
establish that AI produced correct work without review or improved delivery
speed by a measured amount.
