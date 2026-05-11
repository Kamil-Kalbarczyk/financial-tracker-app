# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

No build step. Open `index.html` directly in a browser:

```
start index.html        # Windows
open index.html         # macOS
```

Chart.js is loaded from CDN (`https://cdn.jsdelivr.net/npm/chart.js`) — an internet connection is required on first load.

## Architecture

Three files, no framework, no bundler.

**Data flow:** `localStorage` → `transactions[]` (in-memory array) → render functions → DOM

All state lives in the module-level `transactions` array in `app.js`. Every mutation follows the same pattern:
1. Modify `transactions`
2. Call `saveTransactions()` to persist to `localStorage` (key: `"budget_transactions"`)
3. Call `renderAll()` to re-render summary cards, transaction list, and chart

The one exception is bulk import, which calls `addTransaction()` in a loop (push only, no save/render per row), then does a single `saveTransactions()` + `renderAll()` at the end.

**Rendering is always full-replace** — `renderAll()` calls three independent renderers in sequence. There is no partial/diff update.

**Transaction shape:**
```js
{
  id: "txn_<timestamp>_<random4>",
  type: "income" | "expense",
  description: string,   // may be empty string — display as "—"
  amount: number,        // positive float
  category: string,      // from EXPENSE_CATEGORIES or INCOME_CATEGORIES
  date: "YYYY-MM-DD"
}
```

## Key constants (app.js)

- `EXPENSE_CATEGORIES` — ordered array; also determines doughnut chart segment order and `CATEGORY_COLORS` index mapping
- `CATEGORY_COLORS` — fixed-order hex array aligned to `EXPENSE_CATEGORIES`; adding a category requires adding a color here too

## Form tabs

The form section has two panels (`#panel-single`, `#panel-bulk`) toggled by `switchTab()`. The bulk panel has its own type/category dropdowns (`#bulk-type`, `#bulk-category`) independent of the single-entry form. Both use `populateCategoryDropdown(type, selectId)` — the `selectId` parameter defaults to `'input-category'`.

## Git workflow

After every code change, commit and push with a short message:

```
git add <files>
git commit -m "short description"
git push
```

Remote: https://github.com/Kamil-Kalbarczyk/financial-tracker-app

## Bulk import format

Textarea expects tab-separated rows: `Amount<TAB>Date` per line. `parseImportText()` strips `$`, `,`, and spaces from the amount column and accepts any date string parseable by `new Date()`, normalizing to ISO format.
