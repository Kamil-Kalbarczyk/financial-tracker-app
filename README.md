# Financial Tracker App

A lightweight personal budget tracker that runs entirely in the browser — no installation, no backend, no build step.

---

## Features

- **Track income & expenses** across 7 expense categories and an income category
- **Dashboard summary** — live totals for income, expenses, and balance
- **Spending chart** — doughnut chart showing expense breakdown by category
- **Single entry form** — add one transaction at a time with optional description
- **Bulk import** — paste directly from Excel (Amount + Date columns, tab-separated) to add multiple records at once with a live preview before importing
- **Filters** — filter the transaction list by category, type, and date range
- **Persistent storage** — all data saved in `localStorage`, survives page reloads
- **Responsive** — adapts to mobile and tablet screen sizes

---

## Getting Started

No installation required. Just open the file in a browser:

```
index.html
```

> Chart.js is loaded via CDN — an internet connection is required on first load.

---

## Usage

### Adding a single transaction

1. Fill in **Amount** and **Date** (description is optional)
2. Choose **Type** (Income / Expense) and **Category**
3. Click **Add Transaction**

### Bulk import from Excel

1. In your spreadsheet, select two columns: **Amount** and **Date**
2. Copy the cells (Ctrl+C)
3. Switch to the **Bulk Import** tab in the app
4. Choose Type and Category for all rows
5. Paste into the text area — a preview table appears instantly
6. Click **Import N rows**

---

## Categories

| Expenses | Income |
|---|---|
| Food, Rent, Transport, Entertainment, Health, Shopping, Other | Income |

---

## Tech Stack

| | |
|---|---|
| Language | Vanilla HTML / CSS / JavaScript |
| Chart | [Chart.js](https://www.chartjs.org/) via CDN |
| Storage | `localStorage` |
| Build tools | None |

---

## Project Structure

```
index.html   — app layout and element IDs
style.css    — design system, layout, responsive breakpoints
app.js       — all data logic, rendering, and event handling
```
