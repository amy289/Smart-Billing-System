// Lab 5: JavaScript Fundamentals — Smart Billing System
// Each product is an object; all products are stored in the cart array.
const cart = [];
const invoiceNumber = "AMY-" + new Date().getFullYear() + "-" + String(Date.now()).slice(-5);
const today = new Date();
document.getElementById("invoiceNumber").textContent = invoiceNumber;
document.getElementById("invoiceDate").textContent = today.toLocaleDateString();
document.getElementById("todayLabel").textContent = today.toLocaleDateString();

const form = document.getElementById("productForm");
const rows = document.getElementById("invoiceItems");
const message = document.getElementById("message");

function money(value) { return "Rs. " + Number(value).toFixed(2); }

function addItem(name, price, quantity, stock) {
  const existing = cart.find(item => item.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    if (existing.quantity + quantity > existing.stock) {
      showMessage("Stock limit exceeded for this product.", true);
      return;
    }
    existing.quantity += quantity;
  } else {
    cart.push({ name: name, price: price, quantity: quantity, stock: stock });
  }
  renderInvoice();
  showMessage("Product added successfully.");
}

function removeItem(index) {
  cart.splice(index, 1);
  renderInvoice();
  showMessage("Product removed.");
}

function calculateSubtotal() {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function calculateTotal(discount, taxRate) {
  const subtotal = calculateSubtotal();
  const actualDiscount = Math.min(Math.max(0, discount), subtotal);
  const taxableAmount = subtotal - actualDiscount;
  const tax = taxableAmount * taxRate;
  return { subtotal: subtotal, discount: actualDiscount, tax: tax, grandTotal: taxableAmount + tax };
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
}

function renderInvoice() {
  if (cart.length === 0) {
    rows.innerHTML = '<tr><td colspan="5" class="empty">No products added yet.</td></tr>';
  } else {
    rows.innerHTML = cart.map((item, index) => `
      <tr><td>${escapeHTML(item.name)}</td><td>${money(item.price)}</td>
      <td>${item.quantity}</td><td>${money(item.price * item.quantity)}</td>
      <td class="no-print"><button class="remove" data-remove="${index}" type="button">×</button></td></tr>
    `).join("");
  }
  const discount = Math.max(0, Number(document.getElementById("discountInput").value) || 0);
  const taxRate = Math.min(100, Math.max(0, Number(document.getElementById("taxInput").value) || 0)) / 100;
  const totals = calculateTotal(discount, taxRate);
  document.getElementById("subtotal").textContent = money(totals.subtotal);
  document.getElementById("discountAmount").textContent = "− " + money(totals.discount);
  document.getElementById("taxAmount").textContent = money(totals.tax);
  document.getElementById("grandTotal").textContent = money(totals.grandTotal);
}

function showMessage(text, error = false) {
  message.textContent = text;
  message.style.color = error ? "#b42318" : "#16734d";
}

form.addEventListener("submit", function(event) {
  event.preventDefault();
  const name = document.getElementById("productName").value.trim();
  const price = Number(document.getElementById("productPrice").value);
  const quantity = Number(document.getElementById("productQty").value);
  const stock = Number(document.getElementById("productStock").value);
  if (!name || !Number.isFinite(price) || price <= 0 || !Number.isInteger(quantity) ||
      quantity < 1 || !Number.isInteger(stock) || stock < 1 || quantity > stock) {
    showMessage("Enter valid details. Quantity must be within available stock.", true);
    return;
  }
  addItem(name, price, quantity, stock);
  form.reset();
  document.getElementById("productQty").value = 1;
  document.getElementById("productStock").value = 10;
});

rows.addEventListener("click", event => {
  const button = event.target.closest("[data-remove]");
  if (button) removeItem(Number(button.dataset.remove));
});
document.getElementById("discountInput").addEventListener("input", renderInvoice);
document.getElementById("taxInput").addEventListener("input", renderInvoice);

document.getElementById("clearBillBtn").addEventListener("click", () => {
  cart.length = 0;
  document.getElementById("discountInput").value = 0;
  document.getElementById("taxInput").value = 5;
  renderInvoice();
  showMessage("Bill cleared.");
});

function saveInvoice() {
  const totals = calculateTotal(
    Math.max(0, Number(document.getElementById("discountInput").value) || 0),
    Math.min(100, Math.max(0, Number(document.getElementById("taxInput").value) || 0)) / 100
  );
  const history = JSON.parse(localStorage.getItem("amyyInvoiceHistory") || "[]");
  history.unshift({ number: invoiceNumber, date: new Date().toLocaleString(),
    items: cart.map(item => ({...item})), total: totals.grandTotal });
  localStorage.setItem("amyyInvoiceHistory", JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem("amyyInvoiceHistory") || "[]");
  const target = document.getElementById("historyList");
  if (!history.length) {
    target.innerHTML = '<p class="empty">No saved invoices yet.</p>';
    return;
  }
  target.innerHTML = history.map(inv => `<div class="historyItem">
    <div><strong>${escapeHTML(inv.number)}</strong><span>${escapeHTML(inv.date)} · ${inv.items.length} product type(s)</span></div>
    <b>${money(inv.total)}</b></div>`).join("");
}

document.getElementById("printBtn").addEventListener("click", () => {
  if (!cart.length) { showMessage("Add at least one product before printing.", true); return; }
  saveInvoice();
  window.print();
});
document.getElementById("clearHistoryBtn").addEventListener("click", () => {
  localStorage.removeItem("amyyInvoiceHistory");
  renderHistory();
  showMessage("Invoice history cleared.");
});
renderInvoice();
renderHistory();
