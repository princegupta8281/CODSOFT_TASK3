// RupeeTrack — Personal Cashflow Ledger
// Modular Vanilla JavaScript Implementation for CodSoft Task 3

const STORAGE_KEYS = {
  TRANSACTIONS: "rupeetrack_transactions_v2",
  THEME: "rupeetrack_theme"
};

const CATEGORY_COLORS = {
  "Food & Dining": "var(--cat-food)",
  "College & Books": "var(--cat-college)",
  "Hostel & Rent": "var(--cat-hostel)",
  "Travel & Transit": "var(--cat-travel)",
  "Stipend / Freelance": "var(--cat-stipend)",
  "Shopping & Tech": "var(--cat-shopping)"
};

// Seed dataset for first run
const SEED_TRANSACTIONS = [
  {
    id: "tx-seed-1",
    desc: "Freelance Frontend UI Milestone",
    amount: 8500,
    type: "income",
    category: "Stipend / Freelance",
    date: "2026-11-05"
  },
  {
    id: "tx-seed-2",
    desc: "Monthly Hostel & Mess Plan",
    amount: 3200,
    type: "expense",
    category: "Hostel & Rent",
    date: "2026-11-08"
  },
  {
    id: "tx-seed-3",
    desc: "RGPV Semester Books",
    amount: 650,
    type: "expense",
    category: "College & Books",
    date: "2026-11-11"
  },
  {
    id: "tx-seed-4",
    desc: "Post-Workout Protein & Groceries",
    amount: 1150,
    type: "expense",
    category: "Food & Dining",
    date: "2026-11-14"
  }
];

// Reactive application state
const state = {
  transactions: [],
  filterType: "all",
  filterCategory: "all",
  searchQuery: "",
  editingId: null,
  undoEntry: null,
  undoIndex: -1,
  undoTimer: null,
  undoInterval: null,
  undoRemainingSecs: 5
};

// Format currency as Indian Rupees with tabular precision
function formatINR(val) {
  const num = Number(val) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

// Clean date formatting for financial history
function formatDate(isoStr) {
  if (!isoStr) return "";
  const parts = isoStr.split("-");
  if (parts.length !== 3) return isoStr;
  const year = parts[0];
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

// Helper to get today's date formatted as YYYY-MM-DD
function getTodayDateString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Storage helpers with privacy mode safeguards
function loadTransactionsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (raw === null) {
      // First visit: populate with realistic seed data
      state.transactions = [...SEED_TRANSACTIONS];
      persistTransactions();
    } else {
      state.transactions = JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Storage access restricted. Defaulting to in-memory state.", err);
    state.transactions = [...SEED_TRANSACTIONS];
  }
}

function persistTransactions() {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(state.transactions));
  } catch (err) {
    console.warn("Unable to persist transactions to localStorage.", err);
  }
}

// Visual Theme Toggle with persistence
function initTheme() {
  try {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", nextTheme);
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, nextTheme);
  } catch (e) {}
}

// Computes financial aggregates and updates summary cards
function updateSummaryCards() {
  let incomeTotal = 0;
  let expenseTotal = 0;
  let incomeCount = 0;
  let expenseCount = 0;

  state.transactions.forEach(tx => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === "income") {
      incomeTotal += amt;
      incomeCount += 1;
    } else {
      expenseTotal += amt;
      expenseCount += 1;
    }
  });

  const netBalance = incomeTotal - expenseTotal;
  const balanceCard = document.getElementById("balanceCard");
  const netBalanceEl = document.getElementById("netBalance");
  const balanceStatusDot = document.getElementById("balanceStatusDot");
  const savingsRateBadge = document.getElementById("savingsRateBadge");

  netBalanceEl.textContent = formatINR(netBalance);

  if (netBalance >= 0) {
    balanceCard.classList.remove("negative");
    balanceCard.classList.add("positive");
    balanceStatusDot.classList.remove("negative");
  } else {
    balanceCard.classList.remove("positive");
    balanceCard.classList.add("negative");
    balanceStatusDot.classList.add("negative");
  }

  // Calculate live savings rate
  if (incomeTotal > 0) {
    const rate = ((netBalance / incomeTotal) * 100).toFixed(1);
    savingsRateBadge.textContent = `${rate}% savings rate`;
    if (netBalance < 0) {
      savingsRateBadge.classList.add("negative");
    } else {
      savingsRateBadge.classList.remove("negative");
    }
  } else {
    savingsRateBadge.textContent = "0.0% savings rate";
    savingsRateBadge.classList.remove("negative");
  }

  document.getElementById("totalIncome").textContent = `+${formatINR(incomeTotal)}`;
  document.getElementById("incomeCount").textContent = `${incomeCount} ${incomeCount === 1 ? "entry" : "entries"}`;

  document.getElementById("totalExpense").textContent = `-${formatINR(expenseTotal)}`;
  document.getElementById("expenseCount").textContent = `${expenseCount} ${expenseCount === 1 ? "entry" : "entries"}`;
}

// Computes and renders category breakdown progress bars
function updateAllocationBars() {
  const container = document.getElementById("allocationBarsContainer");
  const totalExpenseEl = document.getElementById("allocTotalExpense");

  const expenseItems = state.transactions.filter(t => t.type === "expense");
  const totalExpense = expenseItems.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  totalExpenseEl.textContent = formatINR(totalExpense);

  if (expenseItems.length === 0 || totalExpense === 0) {
    container.innerHTML = `<p class="alloc-empty">No expense allocations recorded yet.</p>`;
    return;
  }

  // Group amounts by category
  const categoryTotals = {};
  expenseItems.forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + (Number(t.amount) || 0);
  });

  // Sort by highest spending first
  const sortedCategories = Object.keys(categoryTotals).sort(
    (a, b) => categoryTotals[b] - categoryTotals[a]
  );

  container.innerHTML = sortedCategories.map(cat => {
    const amount = categoryTotals[cat];
    const percentage = ((amount / totalExpense) * 100).toFixed(1);
    const color = CATEGORY_COLORS[cat] || "var(--blue-focus)";

    return `
      <div class="alloc-row">
        <div class="alloc-meta">
          <span class="alloc-cat-name">
            <span class="alloc-dot" style="background-color: ${color};"></span>
            ${cat}
          </span>
          <div class="alloc-stats">
            <span class="alloc-val tabular-nums">${formatINR(amount)}</span>
            <span class="alloc-pct tabular-nums">(${percentage}%)</span>
          </div>
        </div>
        <div class="alloc-track">
          <div class="alloc-fill" style="width: ${percentage}%; background-color: ${color};"></div>
        </div>
      </div>
    `;
  }).join("");
}

// Filters transactions according to active segmented controls & search
function getFilteredTransactions() {
  const query = state.searchQuery.trim().toLowerCase();

  return state.transactions.filter(tx => {
    // Type match
    if (state.filterType !== "all" && tx.type !== state.filterType) {
      return false;
    }
    // Category match
    if (state.filterCategory !== "all" && tx.category !== state.filterCategory) {
      return false;
    }
    // Query search match
    if (query) {
      const matchDesc = tx.desc.toLowerCase().includes(query);
      const matchCat = tx.category.toLowerCase().includes(query);
      if (!matchDesc && !matchCat) return false;
    }
    return true;
  });
}

// Renders the transaction list
function renderLedger() {
  const listEl = document.getElementById("transactionList");
  const counterEl = document.getElementById("recordCounter");
  const filtered = getFilteredTransactions();

  counterEl.textContent = `${filtered.length} of ${state.transactions.length} records`;

  if (filtered.length === 0) {
    listEl.innerHTML = `
      <div class="empty-ledger">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="16" rx="3"></rect>
          <line x1="9" y1="9" x2="15" y2="9"></line>
          <line x1="9" y1="13" x2="13" y2="13"></line>
        </svg>
        <p class="empty-title">No transactions found</p>
        <p class="empty-desc">No entries match your current search or filter combination.</p>
      </div>
    `;
    return;
  }

  listEl.innerHTML = filtered.map(tx => {
    const isIncome = tx.type === "income";
    const sign = isIncome ? "+" : "−";
    const isEditing = state.editingId === tx.id;

    return `
      <div class="tx-row ${tx.type} ${isEditing ? "editing" : ""}" data-id="${tx.id}">
        <div class="tx-left">
          <div class="tx-indicator" aria-hidden="true">${sign}</div>
          <div class="tx-details">
            <h3 class="tx-desc" title="${escapeHtml(tx.desc)}">${escapeHtml(tx.desc)}</h3>
            <div class="tx-submeta">
              <span class="tx-cat-badge">${escapeHtml(tx.category)}</span>
              <span class="tx-date">${formatDate(tx.date)}</span>
            </div>
          </div>
        </div>

        <div class="tx-right">
          <span class="tx-amount tabular-nums">${sign}${formatINR(tx.amount)}</span>
          <div class="tx-actions">
            <button
              type="button"
              class="tx-micro-btn"
              data-action="edit"
              data-id="${tx.id}"
              title="Edit transaction"
              aria-label="Edit transaction ${escapeHtml(tx.desc)}"
            >
              <svg class="micro-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M11 4H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button
              type="button"
              class="tx-micro-btn delete-btn"
              data-action="delete"
              data-id="${tx.id}"
              title="Delete transaction"
              aria-label="Delete transaction ${escapeHtml(tx.desc)}"
            >
              <svg class="micro-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="3 6 5 6 17 6"></polyline>
                <path d="M8 6V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2"></path>
                <path d="M16 6v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// Sanitization utility
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Validation system
function clearValidationErrors() {
  document.querySelectorAll(".field-error").forEach(el => el.textContent = "");
  document.querySelectorAll(".has-error").forEach(el => el.classList.remove("has-error"));
}

function validateForm({ desc, amount, category, date }) {
  let isValid = true;
  clearValidationErrors();

  const descInput = document.getElementById("txDesc");
  const amountInput = document.getElementById("txAmount");
  const dateInput = document.getElementById("txDate");

  if (!desc || desc.trim().length < 2) {
    document.getElementById("descError").textContent = "Description must be at least 2 characters.";
    descInput.classList.add("has-error");
    isValid = false;
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    document.getElementById("amountError").textContent = "Please enter an amount greater than ₹0.";
    amountInput.classList.add("has-error");
    isValid = false;
  }

  if (!date) {
    document.getElementById("dateError").textContent = "Please select a valid transaction date.";
    dateInput.classList.add("has-error");
    isValid = false;
  }

  return isValid;
}

// Reset form back to default Add mode
function resetForm() {
  const form = document.getElementById("transactionForm");
  form.reset();
  document.getElementById("editId").value = "";
  document.getElementById("typeExpense").checked = true;
  document.getElementById("txDate").value = getTodayDateString();
  document.getElementById("formHeading").textContent = "Add Transaction";
  document.getElementById("formSubtitle").textContent = "Post a new cashflow entry to your ledger.";
  document.getElementById("submitBtnText").textContent = "Record Entry";
  document.getElementById("cancelEditBtn").classList.add("hidden");
  document.getElementById("editModeIndicator").classList.add("hidden");
  document.getElementById("escHint").classList.add("hidden");
  clearValidationErrors();
  state.editingId = null;
  renderLedger();
}

// Enter edit mode for an existing transaction
function startEdit(id) {
  const tx = state.transactions.find(t => t.id === id);
  if (!tx) return;

  state.editingId = id;
  document.getElementById("editId").value = tx.id;
  document.getElementById("txDesc").value = tx.desc;
  document.getElementById("txAmount").value = tx.amount;
  document.getElementById("txCategory").value = tx.category;
  document.getElementById("txDate").value = tx.date;

  if (tx.type === "income") {
    document.getElementById("typeIncome").checked = true;
  } else {
    document.getElementById("typeExpense").checked = true;
  }

  document.getElementById("formHeading").textContent = "Edit Transaction";
  document.getElementById("formSubtitle").textContent = "Update financial entry details and recalculate.";
  document.getElementById("submitBtnText").textContent = "Update Entry";
  document.getElementById("cancelEditBtn").classList.remove("hidden");
  document.getElementById("editModeIndicator").classList.remove("hidden");
  document.getElementById("escHint").classList.remove("hidden");
  clearValidationErrors();

  renderLedger();

  // Scroll smoothly and focus description
  const formPanel = document.querySelector(".form-panel");
  formPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  document.getElementById("txDesc").focus();
}

// 5-Second Undo Delete Mechanism
function deleteTransaction(id) {
  const index = state.transactions.findIndex(t => t.id === id);
  if (index === -1) return;

  // Finalize any currently pending undo before starting a new one
  if (state.undoTimer) {
    finalizeUndo();
  }

  // Preserve deleted entry in memory for 5-second recovery window
  state.undoEntry = state.transactions[index];
  state.undoIndex = index;

  // Optimistically remove from state
  state.transactions.splice(index, 1);
  persistTransactions();
  updateSummaryCards();
  updateAllocationBars();
  renderLedger();

  showUndoToast();
}

function showUndoToast() {
  const toast = document.getElementById("undoToast");
  const progressBar = document.getElementById("undoProgressBar");
  const timerText = document.getElementById("undoTimerText");
  const labelText = document.getElementById("undoLabel");

  labelText.textContent = `Deleted "${state.undoEntry.desc}"`;
  toast.classList.remove("hidden");

  // Animate progress bar across 5 seconds
  progressBar.style.transition = "none";
  progressBar.style.transform = "scaleX(1)";

  // Force reflow
  void progressBar.offsetWidth;

  progressBar.style.transition = "transform 5000ms linear";
  progressBar.style.transform = "scaleX(0)";

  state.undoRemainingSecs = 5;
  timerText.textContent = `(${state.undoRemainingSecs}s)`;

  state.undoInterval = setInterval(() => {
    state.undoRemainingSecs -= 1;
    if (state.undoRemainingSecs > 0) {
      timerText.textContent = `(${state.undoRemainingSecs}s)`;
    } else {
      timerText.textContent = `(0s)`;
    }
  }, 1000);

  state.undoTimer = setTimeout(() => {
    finalizeUndo();
  }, 5000);
}

function finalizeUndo() {
  clearTimeout(state.undoTimer);
  clearInterval(state.undoInterval);
  state.undoTimer = null;
  state.undoInterval = null;
  state.undoEntry = null;
  state.undoIndex = -1;

  const toast = document.getElementById("undoToast");
  if (toast) {
    toast.classList.add("hidden");
  }
}

function restoreDeletedTransaction() {
  if (!state.undoEntry) return;

  // Re-insert transaction at its previous index
  const insertIndex = Math.min(state.undoIndex, state.transactions.length);
  state.transactions.splice(insertIndex, 0, state.undoEntry);

  persistTransactions();
  updateSummaryCards();
  updateAllocationBars();
  renderLedger();

  finalizeUndo();
}

// Export Ledger to CSV
function exportLedgerToCSV() {
  if (state.transactions.length === 0) {
    return;
  }

  const headers = ["ID", "Date", "Type", "Category", "Description", "Amount (INR)"];
  const rows = state.transactions.map(t => [
    `"${t.id}"`,
    `"${t.date}"`,
    `"${t.type}"`,
    `"${t.category}"`,
    `"${t.desc.replace(/"/g, '""')}"`,
    t.amount
  ]);

  const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.setAttribute("href", url);
  link.setAttribute("download", "expenses_report.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Event Listeners & Bootstrapping
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  loadTransactionsFromStorage();

  // Set default date picker to today
  document.getElementById("txDate").value = getTodayDateString();

  // Render initial dashboard
  updateSummaryCards();
  updateAllocationBars();
  renderLedger();

  // Theme Switcher
  document.getElementById("themeToggleBtn").addEventListener("click", toggleTheme);

  // CSV Export
  document.getElementById("exportCsvBtn").addEventListener("click", exportLedgerToCSV);

  // Transaction Form Submission
  const form = document.getElementById("transactionForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const desc = document.getElementById("txDesc").value;
    const amount = document.getElementById("txAmount").value;
    const category = document.getElementById("txCategory").value;
    const date = document.getElementById("txDate").value;
    const type = document.querySelector('input[name="txType"]:checked').value;
    const editId = document.getElementById("editId").value;

    if (!validateForm({ desc, amount, category, date })) {
      return;
    }

    const numericAmount = Math.round(parseFloat(amount) * 100) / 100;

    if (editId) {
      // Update existing transaction
      const idx = state.transactions.findIndex(t => t.id === editId);
      if (idx !== -1) {
        state.transactions[idx] = {
          ...state.transactions[idx],
          desc: desc.trim(),
          amount: numericAmount,
          type,
          category,
          date
        };
      }
    } else {
      // Insert new transaction at top
      const newTx = {
        id: "tx-" + Date.now(),
        desc: desc.trim(),
        amount: numericAmount,
        type,
        category,
        date
      };
      state.transactions.unshift(newTx);
    }

    persistTransactions();
    updateSummaryCards();
    updateAllocationBars();
    resetForm();
  });

  // Cancel edit button
  document.getElementById("cancelEditBtn").addEventListener("click", resetForm);

  // Keyboard shortcut: Esc to cancel edit
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.editingId) {
      resetForm();
    }
  });

  // Ledger List Action Delegation (Edit / Delete)
  document.getElementById("transactionList").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const action = btn.getAttribute("data-action");
    const id = btn.getAttribute("data-id");

    if (action === "edit") {
      startEdit(id);
    } else if (action === "delete") {
      deleteTransaction(id);
    }
  });

  // Undo Toast Actions
  document.getElementById("undoActionBtn").addEventListener("click", restoreDeletedTransaction);
  document.getElementById("undoDismissBtn").addEventListener("click", finalizeUndo);

  // Ledger Type Filter Tabs
  document.querySelectorAll("[data-type-filter]").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll("[data-type-filter]").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      state.filterType = tab.getAttribute("data-type-filter");
      renderLedger();
    });
  });

  // Category Filter Select
  document.getElementById("categoryFilter").addEventListener("change", (e) => {
    state.filterCategory = e.target.value;
    renderLedger();
  });

  // Keyword Search Input & Clear
  const searchInput = document.getElementById("searchQuery");
  const clearBtn = document.getElementById("searchClearBtn");

  searchInput.addEventListener("input", (e) => {
    state.searchQuery = e.target.value;
    if (state.searchQuery.length > 0) {
      clearBtn.classList.remove("hidden");
    } else {
      clearBtn.classList.add("hidden");
    }
    renderLedger();
  });

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    state.searchQuery = "";
    clearBtn.classList.add("hidden");
    renderLedger();
    searchInput.focus();
  });
});
