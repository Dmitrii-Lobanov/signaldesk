# React live-coding track

## Purpose

Interview practice and product delivery reinforce one another but are not the same exercise. Each component has two passes:

1. **Interview pass:** build the core behavior in 30–45 minutes while narrating requirements, state, edge cases, and trade-offs.
2. **Product pass:** integrate the useful pattern into SignalDesk with accessibility, tests, error recovery, observability, and visual consistency.

Avoid copying the interview solution into production unchanged.

## Practice catalogue

| Exercise | Interview skill | Potential SignalDesk use |
| --- | --- | --- |
| Accessible autocomplete | Debouncing, async state, keyboard behavior | Customer and tag selection |
| Sortable data table | Derived data, stable sorting, semantics | Feedback inbox |
| Accessible modal | Focus management and portals | Create opportunity flow |
| Reusable tabs | Component API and keyboard navigation | Opportunity evidence views |
| Infinite scrolling feed | Pagination, observers, race conditions | Audit and activity feed |
| File explorer tree | Recursion and selection state | Product-area hierarchy |
| Toast notification system | Queues, timers, cleanup | Mutation feedback |
| Multi-step form | State modeling and validation | CSV import configuration |
| Reorderable list | Immutable updates and accessibility | Prioritization shortlist |
| Async resource explorer | Caching, cancellation, loading states | Import and integration browser |

## Suggested delivery order

Use product need rather than catalogue order:

1. Async service status for the foundation slice.
2. Sortable and filterable table for the feedback API and inbox.
3. Accessible autocomplete for customer and tag selection.
4. Multi-step form for import configuration.
5. Toast and recovery UI when reliable mutations begin.
6. Modal, tabs, activity feeds, and reordering only when their product workflows exist.

Do not force a new exercise into every milestone. Repeat a weak exercise or spend the practice hour reviewing reasoning when no catalogue item fits.

## Interview rubric

Score each practice from 0–2 on:

- Clarified requirements before coding.
- Chose a minimal and coherent state model.
- Produced correct behavior and handled an edge case.
- Used semantic HTML and keyboard interaction.
- Explained performance implications without premature optimization.
- Left an obvious path for testing and extension.

Record the score and one improvement in [LEARNING_LOG.md](LEARNING_LOG.md). Repeat weak exercises after at least 48 hours rather than immediately memorizing the solution.

## Production integration gate

A practice component enters the product only when:

- It solves a real SignalDesk workflow.
- Its public API is smaller than the implementation details it hides.
- Keyboard and screen-reader behavior is verified.
- Loading, empty, error, success, and permission states are designed.
- Tests cover user behavior rather than implementation structure.
- Large-data behavior has an explicit strategy.
