import { useState, useMemo, useCallback } from "react";

// ─── Simulated SQL Database Layer ───────────────────────────────────
// In a real Java/Spring Boot app, this would be JPA entities + repositories
// hitting a MySQL/PostgreSQL database. This simulates that backend.

const generateId = () => Math.random().toString(36).substr(2, 9);

const initialProducts = [
  { id: "P001", name: "Socket Set - 1/2\" Drive", sku: "KM-SS-1250", category: "Hand Tools", price: 89.99, quantity: 342, reorderPoint: 50, supplier: "Midwest Tool Co.", lastRestocked: "2026-04-28" },
  { id: "P002", name: "Industrial Lubricant 32oz", sku: "KM-IL-3200", category: "Lubricants", price: 24.50, quantity: 18, reorderPoint: 30, supplier: "ChemPro Industries", lastRestocked: "2026-04-15" },
  { id: "P003", name: "Safety Glasses - Clear Lens", sku: "KM-SG-0100", category: "Safety", price: 12.99, quantity: 1250, reorderPoint: 200, supplier: "SafeVision LLC", lastRestocked: "2026-05-01" },
  { id: "P004", name: "Drill Bit Set - Cobalt", sku: "KM-DB-2400", category: "Power Tool Accessories", price: 67.00, quantity: 89, reorderPoint: 25, supplier: "Midwest Tool Co.", lastRestocked: "2026-04-20" },
  { id: "P005", name: "Nitrile Gloves - Box of 100", sku: "KM-NG-1000", category: "Safety", price: 18.75, quantity: 5, reorderPoint: 50, supplier: "SafeVision LLC", lastRestocked: "2026-03-30" },
  { id: "P006", name: "Cutting Fluid - Gallon", sku: "KM-CF-1280", category: "Lubricants", price: 42.00, quantity: 67, reorderPoint: 20, supplier: "ChemPro Industries", lastRestocked: "2026-04-22" },
  { id: "P007", name: "Tape Measure 25ft", sku: "KM-TM-2500", category: "Hand Tools", price: 15.99, quantity: 410, reorderPoint: 75, supplier: "Midwest Tool Co.", lastRestocked: "2026-05-03" },
  { id: "P008", name: "Wire Brush Set", sku: "KM-WB-0300", category: "Abrasives", price: 22.50, quantity: 156, reorderPoint: 40, supplier: "GritWorks Inc.", lastRestocked: "2026-04-18" },
  { id: "P009", name: "Hex Key Set - Metric", sku: "KM-HK-0900", category: "Hand Tools", price: 19.99, quantity: 0, reorderPoint: 30, supplier: "Midwest Tool Co.", lastRestocked: "2026-02-10" },
  { id: "P010", name: "Welding Helmet - Auto Dark", sku: "KM-WH-5000", category: "Safety", price: 149.99, quantity: 34, reorderPoint: 10, supplier: "SafeVision LLC", lastRestocked: "2026-04-25" },
];

const initialOrders = [
  { id: "ORD-4201", customer: "Dayton Manufacturing", items: [{ productId: "P001", qty: 12 }, { productId: "P004", qty: 6 }], status: "Shipped", date: "2026-05-06", total: 1481.88 },
  { id: "ORD-4202", customer: "Columbus Auto Works", items: [{ productId: "P002", qty: 24 }, { productId: "P006", qty: 8 }], status: "Processing", date: "2026-05-07", total: 924.00 },
  { id: "ORD-4203", customer: "Akron Steel Fabrication", items: [{ productId: "P003", qty: 100 }, { productId: "P005", qty: 50 }, { productId: "P010", qty: 4 }], status: "Pending", date: "2026-05-08", total: 2836.46 },
  { id: "ORD-4204", customer: "Cincinnati Industrial Supply", items: [{ productId: "P007", qty: 30 }, { productId: "P008", qty: 20 }], status: "Shipped", date: "2026-05-05", total: 929.70 },
  { id: "ORD-4205", customer: "Toledo Precision Parts", items: [{ productId: "P001", qty: 5 }, { productId: "P009", qty: 10 }], status: "Pending", date: "2026-05-08", total: 649.85 },
  { id: "ORD-4206", customer: "Dayton Manufacturing", items: [{ productId: "P006", qty: 15 }], status: "Delivered", date: "2026-05-02", total: 630.00 },
  { id: "ORD-4207", customer: "Cleveland Machine Shop", items: [{ productId: "P004", qty: 8 }, { productId: "P008", qty: 12 }], status: "Delivered", date: "2026-05-01", total: 806.00 },
];

// ─── Styles ─────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --bg-primary: #0F1117;
    --bg-secondary: #161821;
    --bg-card: #1C1E2A;
    --bg-hover: #242636;
    --border: #2A2D3E;
    --border-focus: #4A6CF7;
    --text-primary: #E8EAF0;
    --text-secondary: #8B8FA3;
    --text-muted: #5C6078;
    --accent: #4A6CF7;
    --accent-hover: #5B7AF8;
    --accent-dim: rgba(74,108,247,0.12);
    --success: #34D399;
    --success-dim: rgba(52,211,153,0.12);
    --warning: #FBBF24;
    --warning-dim: rgba(251,191,36,0.12);
    --danger: #F87171;
    --danger-dim: rgba(248,113,113,0.12);
    --orange: #FB923C;
    --orange-dim: rgba(251,146,60,0.12);
  }

  body {
    font-family: 'DM Sans', sans-serif;
    background: var(--bg-primary);
    color: var(--text-primary);
    line-height: 1.5;
  }

  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* ── Header ── */
  .header {
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border);
    padding: 16px 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .logo-area {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .logo-mark {
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, var(--accent), #7C3AED);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 14px;
    color: white;
    letter-spacing: -0.5px;
  }

  .logo-text {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.3px;
  }

  .logo-text span {
    color: var(--text-muted);
    font-weight: 400;
    margin-left: 4px;
    font-size: 13px;
  }

  .header-meta {
    font-size: 12px;
    color: var(--text-muted);
    font-family: 'JetBrains Mono', monospace;
  }

  /* ── Nav ── */
  .nav {
    display: flex;
    gap: 2px;
    background: var(--bg-secondary);
    padding: 0 28px;
    border-bottom: 1px solid var(--border);
  }

  .nav-btn {
    padding: 12px 20px;
    background: none;
    border: none;
    color: var(--text-secondary);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .nav-btn:hover { color: var(--text-primary); }
  .nav-btn.active {
    color: var(--accent);
    border-bottom-color: var(--accent);
  }

  .nav-badge {
    background: var(--danger);
    color: white;
    font-size: 10px;
    font-weight: 600;
    padding: 1px 6px;
    border-radius: 8px;
  }

  /* ── Content ── */
  .content { padding: 24px 28px; flex: 1; }

  /* ── Stats Row ── */
  .stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }

  .stat-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
  }

  .stat-label {
    font-size: 12px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 500;
    margin-bottom: 8px;
  }

  .stat-value {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -1px;
    font-family: 'JetBrains Mono', monospace;
  }

  .stat-sub {
    font-size: 12px;
    color: var(--text-secondary);
    margin-top: 4px;
  }

  .stat-value.danger { color: var(--danger); }
  .stat-value.success { color: var(--success); }
  .stat-value.warning { color: var(--warning); }
  .stat-value.accent { color: var(--accent); }

  /* ── Toolbar ── */
  .toolbar {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    align-items: center;
    flex-wrap: wrap;
  }

  .search-box {
    flex: 1;
    min-width: 220px;
    padding: 9px 14px 9px 36px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-primary);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    outline: none;
    transition: border-color 0.15s;
  }

  .search-box:focus { border-color: var(--border-focus); }
  .search-box::placeholder { color: var(--text-muted); }

  .search-wrap {
    position: relative;
    flex: 1;
    min-width: 220px;
  }

  .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    font-size: 13px;
    pointer-events: none;
  }

  select.filter-select {
    padding: 9px 14px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-primary);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    outline: none;
    cursor: pointer;
  }

  .btn {
    padding: 9px 18px;
    border: none;
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .btn-primary {
    background: var(--accent);
    color: white;
  }
  .btn-primary:hover { background: var(--accent-hover); }

  .btn-ghost {
    background: var(--bg-card);
    color: var(--text-secondary);
    border: 1px solid var(--border);
  }
  .btn-ghost:hover { background: var(--bg-hover); color: var(--text-primary); }

  .btn-sm {
    padding: 5px 12px;
    font-size: 12px;
  }

  /* ── Table ── */
  .table-wrap {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  thead {
    background: var(--bg-secondary);
  }

  th {
    padding: 12px 16px;
    text-align: left;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-muted);
    font-weight: 600;
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
    cursor: pointer;
    user-select: none;
  }

  th:hover { color: var(--text-secondary); }

  td {
    padding: 12px 16px;
    font-size: 13px;
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
  }

  tr:last-child td { border-bottom: none; }
  tr:hover td { background: var(--bg-hover); }

  .mono {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
  }

  /* ── Badges ── */
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.2px;
  }

  .badge-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  .badge-success { background: var(--success-dim); color: var(--success); }
  .badge-success .badge-dot { background: var(--success); }

  .badge-warning { background: var(--warning-dim); color: var(--warning); }
  .badge-warning .badge-dot { background: var(--warning); }

  .badge-danger { background: var(--danger-dim); color: var(--danger); }
  .badge-danger .badge-dot { background: var(--danger); }

  .badge-accent { background: var(--accent-dim); color: var(--accent); }
  .badge-accent .badge-dot { background: var(--accent); }

  .badge-orange { background: var(--orange-dim); color: var(--orange); }
  .badge-orange .badge-dot { background: var(--orange); }

  .stock-bar-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .stock-bar-bg {
    width: 60px;
    height: 5px;
    background: var(--bg-hover);
    border-radius: 3px;
    overflow: hidden;
  }

  .stock-bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.3s;
  }

  /* ── Modal ── */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    backdrop-filter: blur(4px);
  }

  .modal {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 28px;
    width: 460px;
    max-width: 95vw;
    max-height: 85vh;
    overflow-y: auto;
  }

  .modal h2 {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 20px;
    letter-spacing: -0.3px;
  }

  .form-group {
    margin-bottom: 14px;
  }

  .form-group label {
    display: block;
    font-size: 12px;
    color: var(--text-secondary);
    margin-bottom: 5px;
    font-weight: 500;
  }

  .form-group input, .form-group select {
    width: 100%;
    padding: 9px 12px;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-primary);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    outline: none;
  }

  .form-group input:focus, .form-group select:focus {
    border-color: var(--border-focus);
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .modal-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 20px;
  }

  /* ── Reports ── */
  .reports-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .report-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 24px;
  }

  .report-card h3 {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 16px;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .bar-chart-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
  }

  .bar-label {
    width: 140px;
    font-size: 12px;
    color: var(--text-secondary);
    text-align: right;
    flex-shrink: 0;
  }

  .bar-track {
    flex: 1;
    height: 22px;
    background: var(--bg-hover);
    border-radius: 6px;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    border-radius: 6px;
    display: flex;
    align-items: center;
    padding-left: 8px;
    font-size: 11px;
    font-weight: 600;
    font-family: 'JetBrains Mono', monospace;
    color: white;
    transition: width 0.5s ease;
    min-width: fit-content;
  }

  .top-products-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .top-product-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    background: var(--bg-secondary);
    border-radius: 8px;
  }

  .top-product-rank {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    background: var(--accent-dim);
    color: var(--accent);
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'JetBrains Mono', monospace;
  }

  .top-product-info {
    flex: 1;
    margin-left: 12px;
  }

  .top-product-name {
    font-size: 13px;
    font-weight: 500;
  }

  .top-product-sku {
    font-size: 11px;
    color: var(--text-muted);
    font-family: 'JetBrains Mono', monospace;
  }

  .top-product-value {
    font-size: 13px;
    font-weight: 600;
    font-family: 'JetBrains Mono', monospace;
    color: var(--success);
  }

  .empty-state {
    text-align: center;
    padding: 48px 20px;
    color: var(--text-muted);
  }

  .empty-state svg {
    margin-bottom: 12px;
    opacity: 0.4;
  }

  .sql-note {
    margin-top: 24px;
    padding: 16px 20px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-left: 3px solid var(--accent);
    border-radius: 0 8px 8px 0;
    font-size: 12px;
    color: var(--text-secondary);
    font-family: 'JetBrains Mono', monospace;
  }

  .sql-note strong {
    color: var(--accent);
    font-weight: 600;
  }
`;

// ─── Helper Components ──────────────────────────────────────────────
function StockBadge({ quantity, reorderPoint }) {
  if (quantity === 0) return <span className="badge badge-danger"><span className="badge-dot" />OUT OF STOCK</span>;
  if (quantity <= reorderPoint) return <span className="badge badge-warning"><span className="badge-dot" />LOW STOCK</span>;
  return <span className="badge badge-success"><span className="badge-dot" />IN STOCK</span>;
}

function StockBar({ quantity, reorderPoint }) {
  const max = Math.max(quantity, reorderPoint * 5, 100);
  const pct = Math.min((quantity / max) * 100, 100);
  const color = quantity === 0 ? "var(--danger)" : quantity <= reorderPoint ? "var(--warning)" : "var(--success)";
  return (
    <div className="stock-bar-wrap">
      <span className="mono" style={{ width: 40, textAlign: "right" }}>{quantity}</span>
      <div className="stock-bar-bg">
        <div className="stock-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function OrderStatusBadge({ status }) {
  const map = {
    Pending: "badge-orange",
    Processing: "badge-accent",
    Shipped: "badge-warning",
    Delivered: "badge-success",
  };
  return <span className={`badge ${map[status] || "badge-accent"}`}><span className="badge-dot" />{status}</span>;
}

// ─── Main App ───────────────────────────────────────────────────────
export default function InventoryManager() {
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState(initialProducts);
  const [orders, setOrders] = useState(initialOrders);

  // Product state
  const [prodSearch, setProdSearch] = useState("");
  const [prodCategory, setProdCategory] = useState("All");
  const [prodStockFilter, setProdStockFilter] = useState("All");
  const [prodSort, setProdSort] = useState({ key: "name", asc: true });
  const [showAddProduct, setShowAddProduct] = useState(false);

  // Order state
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("All");
  const [orderSort, setOrderSort] = useState({ key: "date", asc: false });
  const [showAddOrder, setShowAddOrder] = useState(false);

  const categories = useMemo(() => ["All", ...new Set(products.map(p => p.category))], [products]);

  // ── Filtered + Sorted Products ──
  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      const matchSearch = prodSearch === "" || p.name.toLowerCase().includes(prodSearch.toLowerCase()) || p.sku.toLowerCase().includes(prodSearch.toLowerCase());
      const matchCat = prodCategory === "All" || p.category === prodCategory;
      const matchStock = prodStockFilter === "All" ||
        (prodStockFilter === "Low" && p.quantity > 0 && p.quantity <= p.reorderPoint) ||
        (prodStockFilter === "Out" && p.quantity === 0) ||
        (prodStockFilter === "In" && p.quantity > p.reorderPoint);
      return matchSearch && matchCat && matchStock;
    });
    result.sort((a, b) => {
      let av = a[prodSort.key], bv = b[prodSort.key];
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return prodSort.asc ? -1 : 1;
      if (av > bv) return prodSort.asc ? 1 : -1;
      return 0;
    });
    return result;
  }, [products, prodSearch, prodCategory, prodStockFilter, prodSort]);

  // ── Filtered + Sorted Orders ──
  const filteredOrders = useMemo(() => {
    let result = orders.filter(o => {
      const matchSearch = orderSearch === "" || o.id.toLowerCase().includes(orderSearch.toLowerCase()) || o.customer.toLowerCase().includes(orderSearch.toLowerCase());
      const matchStatus = orderStatusFilter === "All" || o.status === orderStatusFilter;
      return matchSearch && matchStatus;
    });
    result.sort((a, b) => {
      let av = a[orderSort.key], bv = b[orderSort.key];
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return orderSort.asc ? -1 : 1;
      if (av > bv) return orderSort.asc ? 1 : -1;
      return 0;
    });
    return result;
  }, [orders, orderSearch, orderStatusFilter, orderSort]);

  // ── Stats ──
  const stats = useMemo(() => {
    const totalValue = products.reduce((s, p) => s + p.price * p.quantity, 0);
    const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= p.reorderPoint).length;
    const outOfStock = products.filter(p => p.quantity === 0).length;
    const pendingOrders = orders.filter(o => o.status === "Pending" || o.status === "Processing").length;
    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
    return { totalValue, lowStock, outOfStock, pendingOrders, totalRevenue };
  }, [products, orders]);

  // ── Handlers ──
  const toggleProdSort = (key) => setProdSort(s => ({ key, asc: s.key === key ? !s.asc : true }));
  const toggleOrderSort = (key) => setOrderSort(s => ({ key, asc: s.key === key ? !s.asc : true }));

  const addProduct = useCallback((formData) => {
    setProducts(prev => [...prev, {
      id: `P${String(prev.length + 1).padStart(3, "0")}`,
      ...formData,
      lastRestocked: new Date().toISOString().split("T")[0],
    }]);
    setShowAddProduct(false);
  }, []);

  const addOrder = useCallback((formData) => {
    const items = formData.items.filter(i => i.productId && i.qty > 0);
    const total = items.reduce((s, i) => {
      const p = products.find(p => p.id === i.productId);
      return s + (p ? p.price * i.qty : 0);
    }, 0);
    setOrders(prev => [...prev, {
      id: `ORD-${4200 + prev.length + 1}`,
      customer: formData.customer,
      items,
      status: "Pending",
      date: new Date().toISOString().split("T")[0],
      total,
    }]);
    setShowAddOrder(false);
  }, [products]);

  const updateOrderStatus = useCallback((orderId, newStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  }, []);

  // ── Report data ──
  const categoryData = useMemo(() => {
    const map = {};
    products.forEach(p => {
      if (!map[p.category]) map[p.category] = 0;
      map[p.category] += p.price * p.quantity;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [products]);

  const topProducts = useMemo(() => {
    return [...products]
      .map(p => ({ ...p, totalValue: p.price * p.quantity }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);
  }, [products]);

  const ordersByStatus = useMemo(() => {
    const map = {};
    orders.forEach(o => {
      if (!map[o.status]) map[o.status] = { count: 0, revenue: 0 };
      map[o.status].count++;
      map[o.status].revenue += o.total;
    });
    return map;
  }, [orders]);

  const sortArrow = (sort, key) => sort.key === key ? (sort.asc ? " ↑" : " ↓") : "";

  return (
    <>
      <style>{css}</style>
      <div className="app">
        {/* Header */}
        <div className="header">
          <div className="logo-area">
            <div className="logo-mark">KM</div>
            <div className="logo-text">
              InventoryOS<span>v1.0</span>
            </div>
          </div>
          <div className="header-meta">
            {products.length} products &middot; {orders.length} orders &middot; Last sync: just now
          </div>
        </div>

        {/* Nav */}
        <div className="nav">
          <button className={`nav-btn ${tab === "products" ? "active" : ""}`} onClick={() => setTab("products")}>
            ◈ Products
          </button>
          <button className={`nav-btn ${tab === "orders" ? "active" : ""}`} onClick={() => setTab("orders")}>
            ◇ Orders
            {stats.pendingOrders > 0 && <span className="nav-badge">{stats.pendingOrders}</span>}
          </button>
          <button className={`nav-btn ${tab === "reports" ? "active" : ""}`} onClick={() => setTab("reports")}>
            ◆ Reports
          </button>
        </div>

        {/* Content */}
        <div className="content">
          {/* ──── PRODUCTS TAB ──── */}
          {tab === "products" && (
            <>
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-label">Total Products</div>
                  <div className="stat-value accent">{products.length}</div>
                  <div className="stat-sub">{categories.length - 1} categories</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Inventory Value</div>
                  <div className="stat-value success">${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                  <div className="stat-sub">across all products</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Low Stock Items</div>
                  <div className="stat-value warning">{stats.lowStock}</div>
                  <div className="stat-sub">below reorder point</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Out of Stock</div>
                  <div className="stat-value danger">{stats.outOfStock}</div>
                  <div className="stat-sub">needs immediate reorder</div>
                </div>
              </div>

              <div className="toolbar">
                <div className="search-wrap">
                  <span className="search-icon">⌕</span>
                  <input className="search-box" placeholder="Search products by name or SKU..." value={prodSearch} onChange={e => setProdSearch(e.target.value)} />
                </div>
                <select className="filter-select" value={prodCategory} onChange={e => setProdCategory(e.target.value)}>
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
                <select className="filter-select" value={prodStockFilter} onChange={e => setProdStockFilter(e.target.value)}>
                  <option value="All">All Stock</option>
                  <option value="In">In Stock</option>
                  <option value="Low">Low Stock</option>
                  <option value="Out">Out of Stock</option>
                </select>
                <button className="btn btn-primary" onClick={() => setShowAddProduct(true)}>+ Add Product</button>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th onClick={() => toggleProdSort("sku")}>SKU{sortArrow(prodSort, "sku")}</th>
                      <th onClick={() => toggleProdSort("name")}>Product Name{sortArrow(prodSort, "name")}</th>
                      <th onClick={() => toggleProdSort("category")}>Category{sortArrow(prodSort, "category")}</th>
                      <th onClick={() => toggleProdSort("price")}>Price{sortArrow(prodSort, "price")}</th>
                      <th onClick={() => toggleProdSort("quantity")}>Stock{sortArrow(prodSort, "quantity")}</th>
                      <th>Status</th>
                      <th onClick={() => toggleProdSort("supplier")}>Supplier{sortArrow(prodSort, "supplier")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(p => (
                      <tr key={p.id}>
                        <td><span className="mono">{p.sku}</span></td>
                        <td style={{ fontWeight: 500 }}>{p.name}</td>
                        <td style={{ color: "var(--text-secondary)" }}>{p.category}</td>
                        <td><span className="mono">${p.price.toFixed(2)}</span></td>
                        <td><StockBar quantity={p.quantity} reorderPoint={p.reorderPoint} /></td>
                        <td><StockBadge quantity={p.quantity} reorderPoint={p.reorderPoint} /></td>
                        <td style={{ color: "var(--text-secondary)", fontSize: 12 }}>{p.supplier}</td>
                      </tr>
                    ))}
                    {filteredProducts.length === 0 && (
                      <tr><td colSpan={7} className="empty-state">No products match your filters.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="sql-note" style={{ marginTop: 16 }}>
                <strong>// Java equivalent:</strong> SELECT * FROM products WHERE name LIKE '%{prodSearch}%' {prodCategory !== "All" ? `AND category = '${prodCategory}'` : ""} ORDER BY {prodSort.key} {prodSort.asc ? "ASC" : "DESC"};
              </div>
            </>
          )}

          {/* ──── ORDERS TAB ──── */}
          {tab === "orders" && (
            <>
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-label">Total Orders</div>
                  <div className="stat-value accent">{orders.length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Total Revenue</div>
                  <div className="stat-value success">${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Pending</div>
                  <div className="stat-value warning">{orders.filter(o => o.status === "Pending").length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Delivered</div>
                  <div className="stat-value success">{orders.filter(o => o.status === "Delivered").length}</div>
                </div>
              </div>

              <div className="toolbar">
                <div className="search-wrap">
                  <span className="search-icon">⌕</span>
                  <input className="search-box" placeholder="Search by order ID or customer..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} />
                </div>
                <select className="filter-select" value={orderStatusFilter} onChange={e => setOrderStatusFilter(e.target.value)}>
                  <option value="All">All Statuses</option>
                  <option>Pending</option>
                  <option>Processing</option>
                  <option>Shipped</option>
                  <option>Delivered</option>
                </select>
                <button className="btn btn-primary" onClick={() => setShowAddOrder(true)}>+ New Order</button>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th onClick={() => toggleOrderSort("id")}>Order ID{sortArrow(orderSort, "id")}</th>
                      <th onClick={() => toggleOrderSort("customer")}>Customer{sortArrow(orderSort, "customer")}</th>
                      <th>Items</th>
                      <th onClick={() => toggleOrderSort("total")}>Total{sortArrow(orderSort, "total")}</th>
                      <th onClick={() => toggleOrderSort("status")}>Status{sortArrow(orderSort, "status")}</th>
                      <th onClick={() => toggleOrderSort("date")}>Date{sortArrow(orderSort, "date")}</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(o => (
                      <tr key={o.id}>
                        <td><span className="mono" style={{ color: "var(--accent)" }}>{o.id}</span></td>
                        <td style={{ fontWeight: 500 }}>{o.customer}</td>
                        <td style={{ color: "var(--text-secondary)", fontSize: 12 }}>
                          {o.items.map(i => {
                            const p = products.find(p => p.id === i.productId);
                            return p ? `${p.name} ×${i.qty}` : `${i.productId} ×${i.qty}`;
                          }).join(", ")}
                        </td>
                        <td><span className="mono" style={{ fontWeight: 600 }}>${o.total.toFixed(2)}</span></td>
                        <td><OrderStatusBadge status={o.status} /></td>
                        <td><span className="mono">{o.date}</span></td>
                        <td>
                          {o.status === "Pending" && (
                            <button className="btn btn-ghost btn-sm" onClick={() => updateOrderStatus(o.id, "Processing")}>Process</button>
                          )}
                          {o.status === "Processing" && (
                            <button className="btn btn-ghost btn-sm" onClick={() => updateOrderStatus(o.id, "Shipped")}>Ship</button>
                          )}
                          {o.status === "Shipped" && (
                            <button className="btn btn-ghost btn-sm" onClick={() => updateOrderStatus(o.id, "Delivered")}>Deliver</button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredOrders.length === 0 && (
                      <tr><td colSpan={7} className="empty-state">No orders match your filters.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="sql-note" style={{ marginTop: 16 }}>
                <strong>// Java equivalent:</strong> SELECT o.*, GROUP_CONCAT(oi.product_name) FROM orders o JOIN order_items oi ON o.id = oi.order_id WHERE o.customer LIKE '%{orderSearch}%' {orderStatusFilter !== "All" ? `AND o.status = '${orderStatusFilter}'` : ""} GROUP BY o.id ORDER BY o.{orderSort.key} {orderSort.asc ? "ASC" : "DESC"};
              </div>
            </>
          )}

          {/* ──── REPORTS TAB ──── */}
          {tab === "reports" && (
            <>
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-label">Inventory Value</div>
                  <div className="stat-value success">${stats.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Order Revenue</div>
                  <div className="stat-value accent">${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Avg Order Value</div>
                  <div className="stat-value warning">${orders.length > 0 ? (stats.totalRevenue / orders.length).toFixed(2) : "0.00"}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Items Needing Reorder</div>
                  <div className="stat-value danger">{stats.lowStock + stats.outOfStock}</div>
                </div>
              </div>

              <div className="reports-grid">
                <div className="report-card">
                  <h3>Inventory Value by Category</h3>
                  {categoryData.map(([cat, val]) => {
                    const maxVal = categoryData[0][1];
                    return (
                      <div key={cat} className="bar-chart-row">
                        <div className="bar-label">{cat}</div>
                        <div className="bar-track">
                          <div className="bar-fill" style={{
                            width: `${Math.max((val / maxVal) * 100, 15)}%`,
                            background: `linear-gradient(90deg, var(--accent), #7C3AED)`,
                          }}>
                            ${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="report-card">
                  <h3>Top 5 Products by Value</h3>
                  <div className="top-products-list">
                    {topProducts.map((p, i) => (
                      <div key={p.id} className="top-product-row">
                        <div className="top-product-rank">{i + 1}</div>
                        <div className="top-product-info">
                          <div className="top-product-name">{p.name}</div>
                          <div className="top-product-sku">{p.sku}</div>
                        </div>
                        <div className="top-product-value">${p.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="report-card">
                  <h3>Orders by Status</h3>
                  {Object.entries(ordersByStatus).map(([status, data]) => {
                    const maxCount = Math.max(...Object.values(ordersByStatus).map(d => d.count));
                    const colors = { Pending: "var(--orange)", Processing: "var(--accent)", Shipped: "var(--warning)", Delivered: "var(--success)" };
                    return (
                      <div key={status} className="bar-chart-row">
                        <div className="bar-label">{status}</div>
                        <div className="bar-track">
                          <div className="bar-fill" style={{
                            width: `${Math.max((data.count / maxCount) * 100, 20)}%`,
                            background: colors[status] || "var(--accent)",
                          }}>
                            {data.count} orders &middot; ${data.revenue.toFixed(0)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="report-card">
                  <h3>Reorder Alerts</h3>
                  <div className="top-products-list">
                    {products.filter(p => p.quantity <= p.reorderPoint).sort((a, b) => a.quantity - b.quantity).map(p => (
                      <div key={p.id} className="top-product-row">
                        <div className="top-product-rank" style={{ background: p.quantity === 0 ? "var(--danger-dim)" : "var(--warning-dim)", color: p.quantity === 0 ? "var(--danger)" : "var(--warning)" }}>
                          {p.quantity === 0 ? "!" : "⚠"}
                        </div>
                        <div className="top-product-info">
                          <div className="top-product-name">{p.name}</div>
                          <div className="top-product-sku">Qty: {p.quantity} / Reorder at: {p.reorderPoint}</div>
                        </div>
                        <div className="top-product-value" style={{ color: p.quantity === 0 ? "var(--danger)" : "var(--warning)" }}>
                          {p.quantity === 0 ? "OUT" : "LOW"}
                        </div>
                      </div>
                    ))}
                    {products.filter(p => p.quantity <= p.reorderPoint).length === 0 && (
                      <div className="empty-state">All products are well stocked.</div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ──── ADD PRODUCT MODAL ──── */}
        {showAddProduct && <AddProductModal onClose={() => setShowAddProduct(false)} onSubmit={addProduct} categories={categories.filter(c => c !== "All")} />}

        {/* ──── ADD ORDER MODAL ──── */}
        {showAddOrder && <AddOrderModal onClose={() => setShowAddOrder(false)} onSubmit={addOrder} products={products} />}
      </div>
    </>
  );
}

function AddProductModal({ onClose, onSubmit, categories }) {
  const [form, setForm] = useState({
    name: "", sku: "", category: categories[0] || "", price: "", quantity: "", reorderPoint: "", supplier: "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Add New Product</h2>
        <div className="form-group">
          <label>Product Name</label>
          <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Impact Wrench 1/2 Drive" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>SKU</label>
            <input value={form.sku} onChange={e => set("sku", e.target.value)} placeholder="e.g. KM-IW-5000" />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select value={form.category} onChange={e => set("category", e.target.value)}>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Unit Price ($)</label>
            <input type="number" step="0.01" value={form.price} onChange={e => set("price", e.target.value)} placeholder="0.00" />
          </div>
          <div className="form-group">
            <label>Initial Quantity</label>
            <input type="number" value={form.quantity} onChange={e => set("quantity", e.target.value)} placeholder="0" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Reorder Point</label>
            <input type="number" value={form.reorderPoint} onChange={e => set("reorderPoint", e.target.value)} placeholder="0" />
          </div>
          <div className="form-group">
            <label>Supplier</label>
            <input value={form.supplier} onChange={e => set("supplier", e.target.value)} placeholder="Supplier name" />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => {
            if (!form.name || !form.sku) return;
            onSubmit({
              name: form.name, sku: form.sku, category: form.category,
              price: parseFloat(form.price) || 0,
              quantity: parseInt(form.quantity) || 0,
              reorderPoint: parseInt(form.reorderPoint) || 0,
              supplier: form.supplier,
            });
          }}>Add Product</button>
        </div>
      </div>
    </div>
  );
}

function AddOrderModal({ onClose, onSubmit, products }) {
  const [customer, setCustomer] = useState("");
  const [items, setItems] = useState([{ productId: "", qty: 1 }]);

  const addItem = () => setItems(prev => [...prev, { productId: "", qty: 1 }]);
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i, key, val) => setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [key]: val } : item));

  const total = items.reduce((s, i) => {
    const p = products.find(p => p.id === i.productId);
    return s + (p ? p.price * (parseInt(i.qty) || 0) : 0);
  }, 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Create New Order</h2>
        <div className="form-group">
          <label>Customer Name</label>
          <input value={customer} onChange={e => setCustomer(e.target.value)} placeholder="e.g. Dayton Manufacturing" />
        </div>
        <div className="form-group">
          <label>Order Items</label>
          {items.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <select style={{ flex: 2, padding: "8px 10px", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontFamily: "'DM Sans', sans-serif", fontSize: 13 }} value={item.productId} onChange={e => updateItem(i, "productId", e.target.value)}>
                <option value="">Select product...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} (${p.price})</option>)}
              </select>
              <input type="number" min="1" style={{ flex: 0, width: 70, padding: "8px 10px", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontFamily: "'DM Sans', sans-serif", fontSize: 13 }} value={item.qty} onChange={e => updateItem(i, "qty", e.target.value)} />
              {items.length > 1 && (
                <button className="btn btn-ghost btn-sm" onClick={() => removeItem(i)} style={{ padding: "6px 10px", color: "var(--danger)" }}>✕</button>
              )}
            </div>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={addItem} style={{ marginTop: 4 }}>+ Add Item</button>
        </div>
        <div style={{ padding: "12px 0", borderTop: "1px solid var(--border)", marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>Order Total</span>
          <span style={{ fontSize: 20, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "var(--success)" }}>${total.toFixed(2)}</span>
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => {
            if (!customer) return;
            onSubmit({ customer, items: items.map(i => ({ productId: i.productId, qty: parseInt(i.qty) || 0 })) });
          }}>Create Order</button>
        </div>
      </div>
    </div>
  );
}
