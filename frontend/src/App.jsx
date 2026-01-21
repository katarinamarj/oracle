import { useEffect, useMemo, useState } from "react";
import "./App.css";

import Sidebar from "./components/Sidebar";
import DataForm from "./components/DataForm";
import DataTable from "./components/DataTable";

import { formatCell, isDateColumn, formatDateDDMMYYYYDot, toInputValue } from "./utils/format";
import { getTechFromRow, normalizeTechForSubmit, techChanged, emptyTech } from "./utils/tech";

const API = "http://localhost:4000/api";

export default function App() {
  const [tables, setTables] = useState([]);
  const [views, setViews] = useState([]);
  const [selected, setSelected] = useState(null);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  const [originalRow, setOriginalRow] = useState(null);
  const [form, setForm] = useState({});
  const [selectedRowId, setSelectedRowId] = useState(null);

  const isStavkaIzvestaja = selected?.toUpperCase() === "STAVKAIZVESTAJA";

  useEffect(() => {
    loadMeta();
  }, []);

  async function loadMeta() {
    try {
      setError("");

      const tRes = await fetch(`${API}/meta/tables`);
      const vRes = await fetch(`${API}/meta/views`);

      const t = await tRes.json();
      const v = await vRes.json();

      if (!t.ok) throw new Error(t.error?.message || "Greška (tables)");
      if (!v.ok) throw new Error(v.error?.message || "Greška (views)");

      setTables(t.data || []);
      setViews(v.data || []);
    } catch (e) {
      setError(e.message || "Greška");
    }
  }

  async function loadData(name) {
    try {
      setSelected(name);
      setError("");
      setRows([]);
      setForm({});
      setSelectedRowId(null);
      setOriginalRow(null);

      const r = await fetch(`${API}/data/${name}`).then((r) => r.json());

      if (!r.ok) {
        setError(r.error?.message || "Greška");
        setRows([]);
        return;
      }

      setRows(r.data || []);
    } catch (e) {
      setError(e.message || "Greška");
    }
  }

  const cols = useMemo(() => (rows.length ? Object.keys(rows[0]) : []), [rows]);

  const displayCols = useMemo(() => {
    const base = cols.filter((c) => c !== "__ROWID");
    if (!isStavkaIzvestaja) return base;

    const withoutObj = base.filter((c) => c.toUpperCase() !== "TEHNICKIPODACI");

    return [
      ...withoutObj,
      "TEHNICKIPODACI.KILOMETRAZA",
      "TEHNICKIPODACI.PRITISAK",
      "TEHNICKIPODACI.DOT",
      "TEHNICKIPODACI.DUBINA_GUME",
    ];
  }, [cols, isStavkaIzvestaja]);

  const editableCols = useMemo(() => {
    const base = cols.filter((c) => c !== "__ROWID");
    if (!isStavkaIzvestaja) return base;
    return base.filter((c) => c.toUpperCase() !== "TEHNICKIPODACI");
  }, [cols, isStavkaIzvestaja]);

  function setTechField(field, value) {
    setForm((prev) => ({
      ...prev,
      TEHNICKIPODACI: {
        ...(prev.TEHNICKIPODACI || emptyTech()),
        [field]: value,
      },
    }));
  }

  function normalizeFormForSubmit() {
    const payload = { ...form };
    delete payload.__ROWID;

    if (isStavkaIzvestaja) {
      payload.TEHNICKIPODACI = normalizeTechForSubmit(payload.TEHNICKIPODACI);
    }

    return payload;
  }

  async function doInsert() {
    try {
      setError("");
      if (!selected) return;

      const values = normalizeFormForSubmit();

      const resp = await fetch(`${API}/data/${selected}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      }).then((r) => r.json());

      if (!resp.ok) {
        setError(resp.error?.message || "Greška");
        return;
      }

      await loadData(selected);
      onClear();
    } catch (e) {
      setError(e.message || "Greška");
    }
  }

  async function doUpdate() {
    try {
      setError("");

      if (!selectedRowId) {
        setError("Klikni na red u tabeli za UPDATE.");
        return;
      }
      if (!originalRow) {
        setError("Prvo klikni na red da se učita originalni sadržaj.");
        return;
      }

      const next = normalizeFormForSubmit();

      const values = {};
      for (const [k, v] of Object.entries(next)) {
        const oldV = originalRow[k];

        if (isStavkaIzvestaja && k === "TEHNICKIPODACI") {
          const oldT = getTechFromRow(originalRow);
          const newT = v || {};
          if (techChanged(oldT, newT)) values[k] = v;
          continue;
        }

        const a = oldV === null || oldV === undefined ? "" : String(oldV);
        const b = v === null || v === undefined ? "" : String(v);

        if (a !== b) values[k] = v;
      }

      if (Object.keys(values).length === 0) {
        setError("Nema izmena za UPDATE.");
        return;
      }

      const resp = await fetch(`${API}/data/${selected}/${selectedRowId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      }).then((r) => r.json());

      if (!resp.ok) {
        setError(resp.error?.message || "Greška");
        return;
      }

      await loadData(selected);
      onClear();
    } catch (e) {
      setError(e.message || "Greška");
    }
  }

  async function doDelete(rowid) {
    try {
      setError("");

      const resp = await fetch(`${API}/data/${selected}/${rowid}`, {
        method: "DELETE",
      }).then((r) => r.json());

      if (!resp.ok) {
        setError(resp.error?.message || "Greška");
        return;
      }

      await loadData(selected);
      onClear();
    } catch (e) {
      setError(e.message || "Greška");
    }
  }

  function onRowClick(row) {
    setError("");
    setSelectedRowId(row.__ROWID || null);
    setOriginalRow(row);

    const next = { ...row };

    Object.keys(next).forEach((k) => {
      if (k === "__ROWID") return;
      if (isStavkaIzvestaja && k.toUpperCase() === "TEHNICKIPODACI") return;

      if (isDateColumn(k)) {
        next[k] = formatDateDDMMYYYYDot(next[k]);
        return;
      }
      next[k] = toInputValue(next[k]);
    });

    if (isStavkaIzvestaja) {
      next.TEHNICKIPODACI = getTechFromRow(row);
    }

    setForm(next);
  }

  function getDisplayValue(row, col) {
    if (!isStavkaIzvestaja) return formatCell(row[col]);

    if (col.startsWith("TEHNICKIPODACI.")) {
      const tech = getTechFromRow(row);
      const field = col.split(".")[1];
      return formatCell(tech?.[field]);
    }

    return formatCell(row[col]);
  }

  function onClear() {
    setForm({});
    setSelectedRowId(null);
    setOriginalRow(null);
    setError("");
  }

  return (
    <div className="app">
      <Sidebar tables={tables} views={views} selected={selected} onSelect={loadData} />

      <div className="main">
        <h2 className="mainTitle">{selected || "Izaberi tabelu"}</h2>

        {error && <div className="errorBox">{error}</div>}

        {selected && (
          <DataForm
            selected={selected}
            editableCols={editableCols}
            form={form}
            setForm={setForm}
            isStavkaIzvestaja={isStavkaIzvestaja}
            setTechField={setTechField}
            doInsert={doInsert}
            doUpdate={doUpdate}
            onClear={onClear}
          />
        )}

        <DataTable
          rows={rows}
          displayCols={displayCols}
          selectedRowId={selectedRowId}
          onRowClick={onRowClick}
          getDisplayValue={getDisplayValue}
          doDelete={doDelete}
        />

        {selected && rows.length === 0 && !error && <div>Nema podataka.</div>}
      </div>
    </div>
  );
}
