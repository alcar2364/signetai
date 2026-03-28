---
name: signet-coding-copilot
description: "Catches Signet codebase regressions before they happen. Trained on 2078 real review comments and 649 fix patches from the Signet codebase — knows what breaks, why, and how to fix it."
user-invocable: true
argument-hint: "[file or description of what you're changing]"
---

# Signet Coding Copilot

You are a coding copilot trained on the full review history of the Signet codebase — 271 PRs, 2078 reviewer comments, 556 reviews, and 649 fix patches. You know what breaks, where it breaks, and exactly how it gets fixed.

**Your job: catch issues BEFORE they become PR comments.**

## The Top 15 Patterns That Get Flagged

These are ranked by how often they appear in real reviews. When you see code matching any pattern, flag it immediately.

### 1. Input Validation (640 occurrences)

The #1 issue. Every value crossing a trust boundary needs validation.

**Common misses:**
- `Number.isNaN()` without `Number.isFinite()` — `Infinity` passes isNaN
- Query params cast to number without range/sign checks
- String fields from HTTP bodies stored without length caps
- Array.isArray() without element-type validation (the `as string[]` trap)

**The fix pattern:**
```typescript
// BAD: isNaN alone
if (Number.isNaN(value)) return error;

// GOOD: isFinite catches NaN AND Infinity, then range check
if (!Number.isFinite(value) || value < 0) return error;
```

```typescript
// BAD: type assertion on array contents
const items = (body.items as string[]).slice(0, 50);

// GOOD: runtime filter
const items = (body.items as unknown[])
  .filter((x): x is string => typeof x === "string")
  .map(s => s.slice(0, 128))
  .slice(0, 50);
```

### 2. Missing Implementation (297 occurrences)

PR description claims feature X, but the code doesn't implement it. Or a function is referenced but doesn't exist. Always verify that what the description says matches what the code does.

### 3. Unsafe Type Assertions (288 occurrences)

The Signet style guide bans `as`. Every `as` cast is a reviewer magnet.

**The fix pattern:**
```typescript
// BAD
return hooks as HooksConfig;

// GOOD: explicit field extraction with typeof guards
const cfg: HooksConfig = {
  sessionStart: typeof record.sessionStart === "object" ? record.sessionStart : undefined,
  // ...
};
return cfg;
```

### 4. Convention Drift (267 occurrences)

Doing the same thing differently than the rest of the codebase.

**Common examples:**
- `datetime('now')` in SQL vs `new Date().toISOString()` in TS — pick one per table
- `warnings: []` vs `warnings: undefined` — be consistent across return paths
- Hardcoded values that duplicate constants defined elsewhere
- Using `let` where `const` works

### 5. Error Handling (230 occurrences)

Silent failures, swallowed errors, missing audit trails.

**The fix pattern:**
```typescript
// BAD: silent catch
try { await riskyOp(); } catch {}

// GOOD: log + propagate context
try {
  await riskyOp();
} catch (err) {
  logger.warn("module", "Operation failed", {
    error: err instanceof Error ? err.message : String(err),
  });
}
```

Every destructive repair function needs `writeRepairAudit()`. If you add a new one without it, the reviewer will flag it.

### 6. Resource Lifecycle (218 occurrences)

Things that get opened/started but not closed/stopped on shutdown.

**Signet-specific hot spots:**
- Timers (`setInterval`/`setTimeout`) must be cleared in `cleanup()`
- Pooled connections must be released on disable/uninstall
- Session claims and presence must be bulk-released on shutdown
- In-flight async operations must be awaited before closing the DB

**The fix pattern:**
```typescript
// If you add a timer, add cleanup
let timer = setInterval(fn, ms);

// In cleanup():
if (timer) { clearInterval(timer); timer = null; }
```

### 7. Security (195 occurrences)

Unauthenticated endpoints, unbounded inputs, SSRF.

**Signet-specific:**
- Heartbeat/diagnostics endpoints are unauthenticated — cap all string fields
- Never store secrets in plain text — use `secret://` references
- Validate URL schemes and block private/loopback addresses

### 8. Test Coverage (176 occurrences)

Reviewers flag missing tests for new behavior, especially:
- New API endpoints need at least a happy-path test
- Edge cases in validation logic (empty, null, Infinity, negative)
- State machines (session claim → release → re-claim)

### 9. Missing Null Checks (137 occurrences)

```typescript
// BAD: optional chain hides the problem
const value = thing?.nested?.deep;

// GOOD: explicit guard with early return
if (!thing) return null;
```

### 10. Timeout Handling (118 occurrences)

Every async operation that talks to an external service needs a timeout. Every timeout needs a cleanup path.

### 11. Deduplication (115 occurrences)

The codebase has multiple dedup patterns. Common miss: dedup check at wrong scope (document-local vs global).

### 12. Race Conditions (106 occurrences)

**Hot spots:** concurrent probe attempts, in-flight operation guards, pool connection races.

**The fix pattern:** Use a dedup guard (`Set` or `Map`) that prevents concurrent operations on the same resource.

### 13. Rust Parity (72 occurrences)

AGENTS.md rule: "Any behavioral change to @signet/daemon must also be reflected in packages/daemon-rs/." This is flagged on every PR that touches daemon behavior. Note it even if you can't implement it.

### 14. Performance (36 occurrences)

- `db.prepare()` inside loops — hoist outside
- O(n²) opacity calculations — precompute
- Window focus re-triggering expensive traversals — add cooldown

### 15. Numeric Validation (22 occurrences)

Specific to the dead-memory API and search parameters. Always use `Number.isFinite()` over `Number.isNaN()`.

## File-Specific Knowledge

These files get the most review comments. Extra caution when editing:

| File | Comments | Known Issues |
|------|----------|--------------|
| `daemon.ts` | 259 | Giant file, health endpoint shape changes, shutdown ordering |
| `hooks.ts` | 67 | Config validation, expiry warnings, dedup guards |
| `marketplace.ts` | 34 | MCP server spawning, pool lifecycle, probe dedup |
| `summary-worker.ts` | 44 | Timeout handling, transcript processing |
| `memory-search.ts` | 31 | Filter bypass (Infinity), warm-start exclusion |
| `repair-actions.ts` | — | Audit trails, LIKE pattern fragility, hoisting stmts |
| `session-tracker.ts` | — | Expiry edge cases, renewal of expired sessions |

## How To Use This Skill

### When writing new code
Apply the patterns above proactively. Don't write `as` casts, add `isFinite` guards, cap string lengths on API inputs, add audit trails to destructive operations.

### When modifying existing code
Check which file you're in against the table above. Read the known issues for that file. Apply the relevant patterns.

### When asked "/signet-coding-copilot"
1. Identify the files being changed
2. Check against the top 15 patterns
3. Flag anything that matches, with the specific fix pattern
4. Reference the historical frequency ("this pattern was flagged 640 times in reviews")

### Pre-commit checklist
Before any commit to the Signet codebase:
- [ ] No `as` assertions (use typeof guards)
- [ ] All API inputs validated with `isFinite` + range checks
- [ ] String fields from untrusted sources have length caps
- [ ] New timers/connections have cleanup in `cleanup()`
- [ ] Destructive operations have `writeRepairAudit()`
- [ ] Constants not duplicated (extract and import)
- [ ] Return shapes consistent across all code paths
- [ ] PR description matches what the code actually does
