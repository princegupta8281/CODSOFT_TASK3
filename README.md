# RupeeTrack — Personal Cashflow Ledger

> **CodSoft Frontend Development Internship — Task 3**  
> **Author:** Prince Gupta  
> **Architecture:** Pure HTML5, Custom CSS3, and Modular Vanilla JavaScript (Zero External Dependencies)

---

## 1. Project Overview

**RupeeTrack** is a high-precision, hand-crafted personal cashflow ledger engineered with design principles inspired by **Mercury**, **Stripe**, and **Apple Human Interface Guidelines**. It moves beyond generic template clichés to provide a responsive, keyboard-accessible financial tracker tailored for modern engineering and student workflows.

All currency amounts are localized in Indian Rupees (`₹`) using tabular monospace formatting (`font-variant-numeric: tabular-nums`) to guarantee visual alignment across ledger rows.

---

## 2. Design System & Zero-AI Footprint

- **Warm Carbon Charcoal & Apple Titanium Palette**:
  - **Dark Mode (Default `data-theme="dark"`)**: Canvas `#0D0E11` with an inline SVG matte grain filter (`opacity: 0.025`), frosted surface cards (`rgba(24, 25, 30, 0.78)` with `backdrop-filter: saturate(180%) blur(22px)`), hairline borders (`rgba(255, 255, 255, 0.08)`), and top specular rims (`inset 0 1px 0 rgba(255, 255, 255, 0.12)`).
  - **Light Mode (`data-theme="light"`)**: Warm Alabaster Stone `#F5F4F0` canvas, pure `#FFFFFF` cards, crisp `rgba(20, 20, 19, 0.085)` hairline borders, and `#141413` ink.
  - **Fintech Semantic Pastels**:
    - **Inflow / Income**: Muted Sage (`#A7F3D0` on `rgba(167, 243, 208, 0.10)`)
    - **Outflow / Expense**: Soft Rose (`#FECDD3` on `rgba(254, 205, 211, 0.10)`)
    - **Focus & CTAs**: Apple Pro Blue (`#2997FF` / `#0071E3`) and high-contrast monochrome buttons.
- **Typography**: Inter for crisp UI hierarchy and JetBrains Mono for financial precision.
- **Micro-Physics**: Transitions powered by custom Apple cubic bezier easing (`cubic-bezier(0.22, 1, 0.36, 1)`).

---

## 3. Core Features

### 1. Sticky Frosted Header & Controls
- **Branded Monogram**: Clean `₹` titanium badge and sub-header.
- **Theme Switcher**: Instant Dark / Light mode toggle persisted via `localStorage`.
- **Export CSV**: Generates RFC 4180-compliant `expenses_report.csv` directly from ledger state with quote escaping and browser download.

### 2. Financial Overview Cards
- **Current Balance**: Dynamically color-coded (Sage for positive cashflow, Soft Rose for negative balance) alongside a live **Savings Rate %** indicator (`(Inflow - Outflow) / Inflow`).
- **Total Inflow (Income)**: Formatted currency with live credit entry counter.
- **Total Outflow (Expenses)**: Formatted currency with live debit entry counter.

### 3. Add & Edit Transaction Panel
- **Segmented Type Control**: Apple-style sliding pill toggle between `Expense (−)` and `Income (+)`.
- **Input Fields**:
  - Description / Note (minimum 2 characters).
  - Amount in INR (`₹` currency prefix, validation against non-positive numbers).
  - Category selector (`Food & Dining`, `College & Books`, `Hostel & Rent`, `Travel & Transit`, `Stipend / Freelance`, `Shopping & Tech`).
  - Date input defaulted to current date.
- **Validation**: Inline error hints beneath invalid fields with hairline rose input states (zero `alert()` popups).
- **Edit Workflow**: Selecting `Edit` on any historical transaction populates the form, toggles button to `Update Entry`, reveals a `Cancel` button, and enables keyboard cancellation via <kbd>Esc</kbd>.

### 4. Live Expense Allocation Bars
- Computes proportional category share against total expenses in real time.
- Displays colored category tags, formatted sums, and percentage allocation bars with smooth width transitions.

### 5. Transaction Ledger & Filtering
- **Multi-Tier Filtering**:
  - Segmented Type tabs (`All`, `Expenses`, `Income`).
  - Category dropdown filter.
  - Instant live search input with query-clearing button.
- **Active Record Counter**: Displays `Showing X of Y records`.
- **Row Micro-Interactions**: Edit and Delete micro-buttons with sleek SVG iconography.

### 6. 5-Second Undo Toast Notification
- Deleting an entry optimistically removes it from the ledger immediately and updates cards.
- Displays a floating frosted-glass Undo Toast at the bottom-right corner with a live 5-second countdown progress bar.
- Clicking **Undo** restores the transaction at its exact prior index without page reloads.

### 7. Resilient Storage & First-Run Seed Data
- All operations are guarded with `try / catch` against strict browser privacy modes.
- On the initial run, 4 realistic student/developer seed transactions are pre-populated so metrics are visible immediately.

---

## 4. File Structure

```
CODSOFT_TASK3/
├── index.html        # Semantic HTML5 scaffolding & accessibility landmarks
├── style.css         # Custom CSS3 design tokens, theme variables & animations
├── script.js         # Reactive Vanilla JavaScript application state & handlers
└── README.md         # Architecture, design system, and feature documentation
```

---

## 5. Running the Application

Because RupeeTrack is 100% dependency-free, you can run it directly:

1. Double-click `index.html` to open it in any modern browser (Chrome, Edge, Firefox, Safari).
2. Or serve it via any static server:
   ```bash
   # Python 3
   python -m http.server 3000
   
   # Node.js npx serve
   npx serve .
   ```
3. Open `http://localhost:3000` in your browser.
