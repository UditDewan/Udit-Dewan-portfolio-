import { useState, useEffect, useCallback } from "react";

// ── Simulated backend (mirrors the Java service layer exactly) ──────
const createBackend = () => {
  let idCounter = 1;
  const products = new Map();

  const seed = () => {
    const items = [
      { sku: "FAS-1001", name: 'Hex Cap Screw 1/4-20 x 1"', category: "Fasteners", description: "Grade 5 zinc-plated hex cap screw. Box of 100.", unitPrice: 12.49, quantityOnHand: 2500, reorderPoint: 500, warehouseLocation: "A-101" },
      { sku: "FAS-1002", name: "Lock Nut Nylon Insert 3/8-16", category: "Fasteners", description: "Zinc-plated nylon insert lock nut. Box of 50.", unitPrice: 8.99, quantityOnHand: 1800, reorderPoint: 400, warehouseLocation: "A-102" },
      { sku: "FAS-1003", name: 'Flat Washer SAE 5/16"', category: "Fasteners", description: "Zinc-plated SAE flat washer. Box of 100.", unitPrice: 5.29, quantityOnHand: 3200, reorderPoint: 600, warehouseLocation: "A-103" },
      { sku: "CUT-2001", name: "Cobalt Drill Bit Set 1/16-1/2", category: "Cutting Tools", description: "29-piece cobalt drill bit set in metal index.", unitPrice: 89.95, quantityOnHand: 150, reorderPoint: 30, warehouseLocation: "B-201" },
      { sku: "CUT-2002", name: "Bi-Metal Hole Saw Kit", category: "Cutting Tools", description: "13-piece bi-metal hole saw kit with arbors.", unitPrice: 74.50, quantityOnHand: 85, reorderPoint: 20, warehouseLocation: "B-202" },
      { sku: "CUT-2003", name: "Carbide Burr Set 10pc", category: "Cutting Tools", description: "Double-cut carbide burr set for deburring.", unitPrice: 45.99, quantityOnHand: 12, reorderPoint: 25, warehouseLocation: "B-203" },
      { sku: "SAF-3001", name: "Nitrile Gloves Large Box/100", category: "Safety", description: "Powder-free disposable nitrile gloves. 4 mil.", unitPrice: 14.99, quantityOnHand: 800, reorderPoint: 200, warehouseLocation: "C-301" },
      { sku: "SAF-3002", name: "Safety Glasses Clear Anti-Fog", category: "Safety", description: "ANSI Z87.1+ rated clear safety glasses.", unitPrice: 6.49, quantityOnHand: 45, reorderPoint: 100, warehouseLocation: "C-302" },
      { sku: "SAF-3003", name: "Hearing Protection NRR 32dB", category: "Safety", description: "Over-the-head earmuff hearing protector.", unitPrice: 22.95, quantityOnHand: 320, reorderPoint: 75, warehouseLocation: "C-303" },
      { sku: "LUB-4001", name: "Penetrating Oil 11oz Aerosol", category: "Lubricants", description: "Fast-acting penetrating oil.", unitPrice: 9.49, quantityOnHand: 600, reorderPoint: 150, warehouseLocation: "D-401" },
      { sku: "LUB-4002", name: "White Lithium Grease 14oz", category: "Lubricants", description: "Multi-purpose white lithium grease cartridge.", unitPrice: 7.99, quantityOnHand: 10, reorderPoint: 100, warehouseLocation: "D-402" },
      { sku: "LUB-4003", name: "Thread Sealant Tape 1/2x520", category: "Lubricants", description: "PTFE thread sealant tape. Pack of 10.", unitPrice: 11.49, quantityOnHand: 450, reorderPoint: 100, warehouseLocation: "D-403" },
      { sku: "ELE-5001", name: "Wire Terminal Assortment Kit", category: "Electrical", description: "175-piece insulated wire terminal assortment.", unitPrice: 29.95, quantityOnHand: 200, reorderPoint: 50, warehouseLocation: "E-501" },
      { sku: "ELE-5002", name: 'Cable Tie 8" Black 100-Pack', category: "Electrical", description: "UV-resistant nylon cable ties.", unitPrice: 4.99, quantityOnHand: 1500, reorderPoint: 300, warehouseLocation: "E-502" },
      { sku: "ABR-6001", name: 'Flap Disc 4.5" 60-Grit', category: "Abrasives", description: "Zirconia alumina flap disc.", unitPrice: 6.79, quantityOnHand: 5, reorderPoint: 50, warehouseLocation: "F-601" },
      { sku: "ABR-6002", name: 'Cut-Off Wheel 4.5" x .045"', category: "Abrasives", description: "Type 27 aluminum oxide cutting wheel. 25pk.", unitPrice: 18.99, quantityOnHand: 280, reorderPoint: 60, warehouseLocation: "F-602" },
    ];
    items.forEach(item => {
      const id = idCounter++;
      const now = new Date().toISOString();
      products.set(id, { ...item, id, createdAt: now, updatedAt: now });
    });
  };

  seed();

  return {
    findAll: () => [...products.values()].sort((a, b) => a.name.localeCompare(b.name)),
    findById: (id) => products.get(id) || null,
    search: (q) => {
      const lower = q.toLowerCase();
      return [...products.values()].filter(p => p.name.toLowerCase().includes(lower) || p.sku.toLowerCase().includes(lower));
    },
    save: (p) => {
      const exists = [...products.values()].some(x => x.sku.toUpperCase() === p.sku.toUpperCase());
      if (exists) throw new Error(`SKU '${p.sku}' already exists`);
      const id = idCounter++;
      const now = new Date().toISOString();
      const product = { ...p, id, sku: p.sku.toUpperCase().trim(), createdAt: now, updatedAt: now };
      products.set(id, product);
      return product;
    },
    update: (id, p) => {
      if (!products.has(id)) throw new Error("Product not found");
      const conflict = [...products.values()].some(x => x.sku.toUpperCase() === p.sku.toUpperCase() && x.id !== id);
      if (conflict) throw new Error(`SKU '${p.sku}' already exists`);
      const now = new Date().toISOString();
      const existing = products.get(id);
      const updated = { ...existing, ...p, id, sku: p.sku.toUpperCase().trim(), updatedAt: now, createdAt: existing.createdAt };
      products.set(id, updated);
      return updated;
    },
    delete: (id) => products.delete(id),
    summary: () => {
      const all = [...products.values()];
      const lowStock = all.filter(p => p.quantityOnHand <= p.reorderPoint);
      const totalValue = all.reduce((sum, p) => sum + p.unitPrice * p.quantityOnHand, 0);
      const cats = {};
      all.forEach(p => { cats[p.category] = (cats[p.category] || 0) + 1; });
      return { totalProducts: all.length, lowStockCount: lowStock.length, totalInventoryValue: totalValue, categoryBreakdown: cats };
    },
    categories: () => [...new Set([...products.values()].map(p => p.category))].sort(),
    lowStock: () => [...products.values()].filter(p => p.quantityOnHand <= p.reorderPoint).sort((a, b) => a.quantityOnHand - b.quantityOnHand),
  };
};

const db = createBackend();

// ── Icons ───────────────────────────────────────────────────────────
const Icon = ({ type, size = 18 }) => {
  const s = { width: size, height: size, strokeWidth: 1.5, fill: "none", stroke: "currentColor" };
  const paths = {
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>,
    alert: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    box: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
    dollar: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
    x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    check: <><polyline points="20 6 9 17 4 12"/></>,
    grid: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>,
    list: <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
    warehouse: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
  };
  return <svg viewBox="0 0 24 24" style={s} xmlns="http://www.w3.org/2000/svg">{paths[type]}</svg>;
};

// ── Styles ──────────────────────────────────────────────────────────
const palette = {
  bg: "#0C0E12", surface: "#14171E", surfaceAlt: "#1A1E27", border: "#252A35",
  text: "#E8ECF4", textMuted: "#7B8399", textDim: "#4A5068",
  accent: "#3B82F6", accentHover: "#2563EB", accentSoft: "rgba(59,130,246,0.12)",
  green: "#22C55E", greenSoft: "rgba(34,197,94,0.12)",
  amber: "#F59E0B", amberSoft: "rgba(245,158,11,0.12)",
  red: "#EF4444", redSoft: "rgba(239,68,68,0.12)",
};

// ── Components ──────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color }) => (
  <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 10, padding: "18px 20px", flex: 1, minWidth: 160 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <div style={{ color: color || palette.accent, background: color ? `${color}18` : palette.accentSoft, borderRadius: 7, padding: 6, display: "flex" }}>
        <Icon type={icon} size={16} />
      </div>
      <span style={{ fontSize: 12, color: palette.textMuted, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
    </div>
    <div style={{ fontSize: 26, fontWeight: 700, color: palette.text, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.02em" }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: palette.textMuted, marginTop: 4 }}>{sub}</div>}
  </div>
);

const Badge = ({ children, color }) => (
  <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 5, background: `${color}18`, color, letterSpacing: "0.02em" }}>{children}</span>
);

const Btn = ({ children, variant = "default", onClick, disabled, style: s2 }) => {
  const styles = {
    primary: { background: palette.accent, color: "#fff", border: "none" },
    danger: { background: "transparent", color: palette.red, border: `1px solid ${palette.red}40` },
    ghost: { background: "transparent", color: palette.textMuted, border: `1px solid ${palette.border}` },
    default: { background: palette.surfaceAlt, color: palette.text, border: `1px solid ${palette.border}` },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...styles[variant], padding: "8px 14px", borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, display: "inline-flex", alignItems: "center", gap: 6, transition: "all 0.15s", fontFamily: "inherit", ...s2 }}>
      {children}
    </button>
  );
};

const Input = ({ label, ...props }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    {label && <label style={{ fontSize: 12, fontWeight: 500, color: palette.textMuted }}>{label}</label>}
    <input {...props} style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 7, padding: "9px 12px", fontSize: 13, color: palette.text, outline: "none", fontFamily: "inherit", ...(props.style || {}) }} />
  </div>
);

const Select = ({ label, options, ...props }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    {label && <label style={{ fontSize: 12, fontWeight: 500, color: palette.textMuted }}>{label}</label>}
    <select {...props} style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 7, padding: "9px 12px", fontSize: 13, color: palette.text, outline: "none", fontFamily: "inherit" }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

// ── Product Form Modal ──────────────────────────────────────────────
const ProductForm = ({ product, onSave, onCancel }) => {
  const [form, setForm] = useState(product || { sku: "", name: "", category: "Fasteners", description: "", unitPrice: "", quantityOnHand: "", reorderPoint: "", warehouseLocation: "" });
  const [error, setError] = useState("");
  const isEdit = !!product?.id;

  const cats = ["Fasteners", "Cutting Tools", "Safety", "Lubricants", "Electrical", "Abrasives", "Hand Tools", "Welding"];
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = () => {
    setError("");
    if (!form.sku || !form.name || !form.category) { setError("SKU, name, and category are required"); return; }
    if (!form.unitPrice || parseFloat(form.unitPrice) <= 0) { setError("Unit price must be greater than zero"); return; }
    const data = { ...form, unitPrice: parseFloat(form.unitPrice), quantityOnHand: parseInt(form.quantityOnHand) || 0, reorderPoint: parseInt(form.reorderPoint) || 0 };
    try {
      onSave(data);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(4px)" }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 14, padding: 28, width: 460, maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: palette.text, margin: 0 }}>{isEdit ? "Edit Product" : "Add New Product"}</h3>
          <button onClick={onCancel} style={{ background: "none", border: "none", color: palette.textMuted, cursor: "pointer", padding: 4 }}><Icon type="x" /></button>
        </div>

        {error && <div style={{ background: palette.redSoft, border: `1px solid ${palette.red}30`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: palette.red }}>{error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Input label="SKU" value={form.sku} onChange={e => set("sku", e.target.value)} placeholder="e.g. FAS-1004" />
          <Select label="Category" value={form.category} onChange={e => set("category", e.target.value)} options={cats.map(c => ({ value: c, label: c }))} />
          <div style={{ gridColumn: "1 / -1" }}><Input label="Product Name" value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Socket Head Cap Screw" style={{ width: "100%", boxSizing: "border-box" }} /></div>
          <Input label="Unit Price ($)" type="number" step="0.01" value={form.unitPrice} onChange={e => set("unitPrice", e.target.value)} placeholder="0.00" />
          <Input label="Warehouse Location" value={form.warehouseLocation} onChange={e => set("warehouseLocation", e.target.value)} placeholder="e.g. A-101" />
          <Input label="Quantity On Hand" type="number" value={form.quantityOnHand} onChange={e => set("quantityOnHand", e.target.value)} placeholder="0" />
          <Input label="Reorder Point" type="number" value={form.reorderPoint} onChange={e => set("reorderPoint", e.target.value)} placeholder="0" />
          <div style={{ gridColumn: "1 / -1" }}><Input label="Description" value={form.description} onChange={e => set("description", e.target.value)} placeholder="Brief product description..." style={{ width: "100%", boxSizing: "border-box" }} /></div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
          <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
          <Btn variant="primary" onClick={submit}><Icon type="check" size={14} /> {isEdit ? "Update" : "Create"}</Btn>
        </div>
      </div>
    </div>
  );
};

// ── Delete Confirm Modal ────────────────────────────────────────────
const DeleteConfirm = ({ product, onConfirm, onCancel }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(4px)" }} onClick={onCancel}>
    <div onClick={e => e.stopPropagation()} style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 14, padding: 28, width: 380, textAlign: "center" }}>
      <div style={{ color: palette.red, background: palette.redSoft, width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
        <Icon type="trash" size={22} />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: palette.text, margin: "0 0 8px" }}>Delete Product?</h3>
      <p style={{ fontSize: 13, color: palette.textMuted, margin: "0 0 22px" }}>
        <strong>{product.sku}</strong> — {product.name}<br />This action cannot be undone.
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn variant="danger" onClick={onConfirm} style={{ background: palette.red, color: "#fff", border: "none" }}><Icon type="trash" size={14} /> Delete</Btn>
      </div>
    </div>
  </div>
);

// ── Category Color Map ──────────────────────────────────────────────
const catColors = { Fasteners: "#3B82F6", "Cutting Tools": "#8B5CF6", Safety: "#22C55E", Lubricants: "#F59E0B", Electrical: "#EC4899", Abrasives: "#F97316", "Hand Tools": "#06B6D4", Welding: "#EF4444" };

// ── Main App ────────────────────────────────────────────────────────
export default function App() {
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [view, setView] = useState("table");

  const refresh = useCallback(() => {
    setProducts(search ? db.search(search) : filter === "low" ? db.lowStock() : filter !== "all" ? db.findAll().filter(p => p.category === filter) : db.findAll());
    setSummary(db.summary());
  }, [search, filter]);

  useEffect(() => { refresh(); }, [refresh]);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2800); };

  const handleCreate = (data) => { db.save(data); setShowForm(null); refresh(); showToast("Product created"); };
  const handleUpdate = (data) => { db.update(showForm.id, data); setShowForm(null); refresh(); showToast("Product updated"); };
  const handleDelete = () => { db.delete(deleteTarget.id); setDeleteTarget(null); refresh(); showToast("Product deleted", "warning"); };

  const fmt = (n) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
  const categories = db.categories();

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: palette.bg, color: palette.text, minHeight: "100vh", padding: "24px 28px" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ background: "linear-gradient(135deg, #3B82F6, #1D4ED8)", borderRadius: 8, padding: 7, display: "flex" }}>
              <Icon type="box" size={18} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>Inventory Manager</h1>
          </div>
          <p style={{ fontSize: 13, color: palette.textMuted, margin: 0, marginLeft: 44 }}>Kimball Midwest — Industrial Supply CRUD Demo</p>
        </div>
        <Btn variant="primary" onClick={() => setShowForm({})}><Icon type="plus" size={14} /> Add Product</Btn>
      </div>

      {/* Stats */}
      {summary && (
        <div style={{ display: "flex", gap: 14, marginBottom: 22, flexWrap: "wrap" }}>
          <StatCard icon="box" label="Products" value={summary.totalProducts} sub={`${categories.length} categories`} />
          <StatCard icon="dollar" label="Inventory Value" value={fmt(summary.totalInventoryValue)} />
          <StatCard icon="alert" label="Low Stock" value={summary.lowStockCount} sub="Below reorder point" color={summary.lowStockCount > 0 ? palette.amber : palette.green} />
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: palette.textDim }}><Icon type="search" size={15} /></div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or SKU..." style={{ width: "100%", boxSizing: "border-box", background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 8, padding: "9px 12px 9px 34px", fontSize: 13, color: palette.text, outline: "none", fontFamily: "inherit" }} />
        </div>
        <div style={{ display: "flex", gap: 4, background: palette.surface, borderRadius: 8, padding: 3, border: `1px solid ${palette.border}` }}>
          {[{ k: "all", l: "All" }, { k: "low", l: "Low Stock" }, ...categories.map(c => ({ k: c, l: c }))].map(f => (
            <button key={f.k} onClick={() => setFilter(f.k)} style={{ padding: "5px 10px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", background: filter === f.k ? palette.accent : "transparent", color: filter === f.k ? "#fff" : palette.textMuted, transition: "all 0.15s" }}>{f.l}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 2, background: palette.surface, borderRadius: 7, padding: 2, border: `1px solid ${palette.border}` }}>
          <button onClick={() => setView("table")} style={{ padding: 6, borderRadius: 5, border: "none", background: view === "table" ? palette.surfaceAlt : "transparent", color: view === "table" ? palette.text : palette.textDim, cursor: "pointer", display: "flex" }}><Icon type="list" size={14} /></button>
          <button onClick={() => setView("grid")} style={{ padding: 6, borderRadius: 5, border: "none", background: view === "grid" ? palette.surfaceAlt : "transparent", color: view === "grid" ? palette.text : palette.textDim, cursor: "pointer", display: "flex" }}><Icon type="grid" size={14} /></button>
        </div>
      </div>

      {/* Grid View */}
      {view === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {products.map(p => {
            const low = p.quantityOnHand <= p.reorderPoint;
            return (
              <div key={p.id} style={{ background: palette.surface, border: `1px solid ${low ? `${palette.amber}30` : palette.border}`, borderRadius: 10, padding: 18, transition: "border-color 0.2s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <Badge color={catColors[p.category] || palette.accent}>{p.category}</Badge>
                  <span style={{ fontSize: 11, color: palette.textDim, fontFamily: "'JetBrains Mono', monospace" }}>{p.sku}</span>
                </div>
                <h4 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 6px", color: palette.text }}>{p.name}</h4>
                <p style={{ fontSize: 12, color: palette.textMuted, margin: "0 0 14px", lineHeight: 1.4 }}>{p.description}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
                  <div><span style={{ color: palette.textDim }}>Price</span><br /><span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{fmt(p.unitPrice)}</span></div>
                  <div><span style={{ color: palette.textDim }}>Stock</span><br /><span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: low ? palette.amber : palette.green }}>{p.quantityOnHand.toLocaleString()}</span></div>
                  <div><span style={{ color: palette.textDim }}>Reorder At</span><br /><span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{p.reorderPoint}</span></div>
                  <div><span style={{ color: palette.textDim }}>Location</span><br /><span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{p.warehouseLocation}</span></div>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 14, borderTop: `1px solid ${palette.border}`, paddingTop: 12 }}>
                  <Btn variant="ghost" onClick={() => setShowForm(p)} style={{ flex: 1, justifyContent: "center" }}><Icon type="edit" size={13} /> Edit</Btn>
                  <Btn variant="danger" onClick={() => setDeleteTarget(p)} style={{ padding: "8px 10px" }}><Icon type="trash" size={13} /></Btn>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${palette.border}` }}>
                  {["SKU", "Product Name", "Category", "Price", "Stock", "Reorder Pt", "Location", "Status", ""].map(h => (
                    <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: palette.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const low = p.quantityOnHand <= p.reorderPoint;
                  return (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${palette.border}08` }}>
                      <td style={{ padding: "10px 14px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: palette.textMuted }}>{p.sku}</td>
                      <td style={{ padding: "10px 14px", fontWeight: 500 }}>{p.name}</td>
                      <td style={{ padding: "10px 14px" }}><Badge color={catColors[p.category] || palette.accent}>{p.category}</Badge></td>
                      <td style={{ padding: "10px 14px", fontFamily: "'JetBrains Mono', monospace" }}>{fmt(p.unitPrice)}</td>
                      <td style={{ padding: "10px 14px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: low ? palette.amber : palette.text }}>{p.quantityOnHand.toLocaleString()}</td>
                      <td style={{ padding: "10px 14px", fontFamily: "'JetBrains Mono', monospace", color: palette.textDim }}>{p.reorderPoint}</td>
                      <td style={{ padding: "10px 14px", fontFamily: "'JetBrains Mono', monospace", color: palette.textDim }}>{p.warehouseLocation}</td>
                      <td style={{ padding: "10px 14px" }}>{low ? <Badge color={palette.amber}>LOW STOCK</Badge> : <Badge color={palette.green}>OK</Badge>}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button onClick={() => setShowForm(p)} style={{ background: "none", border: "none", color: palette.textMuted, cursor: "pointer", padding: 4, borderRadius: 4 }}><Icon type="edit" size={14} /></button>
                          <button onClick={() => setDeleteTarget(p)} style={{ background: "none", border: "none", color: palette.textDim, cursor: "pointer", padding: 4, borderRadius: 4 }}><Icon type="trash" size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "10px 14px", borderTop: `1px solid ${palette.border}`, fontSize: 12, color: palette.textMuted }}>
            Showing {products.length} product{products.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}

      {/* Modals */}
      {showForm !== null && <ProductForm product={showForm.id ? showForm : null} onSave={showForm.id ? handleUpdate : handleCreate} onCancel={() => setShowForm(null)} />}
      {deleteTarget && <DeleteConfirm product={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: toast.type === "warning" ? palette.amber : palette.green, color: "#000", padding: "10px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, boxShadow: "0 8px 30px rgba(0,0,0,0.3)", animation: "slideIn 0.25s ease-out", zIndex: 200 }}>
          {toast.msg}
        </div>
      )}

      {/* Architecture footer */}
      <div style={{ marginTop: 28, padding: "18px 20px", background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 10 }}>
        <div style={{ fontSize: 11, color: palette.textDim, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 10 }}>Java Project Architecture</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: palette.textMuted, lineHeight: 1.8 }}>
          <span style={{ color: palette.accent }}>Controller</span> → REST routing, JSON, CORS &nbsp;│&nbsp;
          <span style={{ color: "#8B5CF6" }}>Service</span> → Validation, business logic &nbsp;│&nbsp;
          <span style={{ color: palette.green }}>Repository</span> → Interface + in-memory impl &nbsp;│&nbsp;
          <span style={{ color: palette.amber }}>Model</span> → Domain entity with business methods &nbsp;│&nbsp;
          <span style={{ color: palette.red }}>Tests</span> → 18 unit tests, full coverage
        </div>
      </div>

      <style>{`@keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  );
}
