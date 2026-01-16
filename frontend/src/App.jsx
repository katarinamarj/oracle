import { useEffect, useMemo, useState } from "react";

const API = "http://localhost:4000/api";

export default function App() {
  const [tables, setTables] = useState([]);
  const [views, setViews] = useState([]);
  const [selected, setSelected] = useState(null);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  async function loadMeta() {
    setError("");

    const t = await fetch(`${API}/meta/tables`).then((r) => r.json());
    const v = await fetch(`${API}/meta/views`).then((r) => r.json());

    setTables(t.data || []);
    setViews(v.data || []);
  }

  async function loadData(name) {
    setSelected(name);
    setError("");

    const r = await fetch(`${API}/data/${name}`).then((r) => r.json());

    if (!r.ok) {
      setError(r.error?.message || "Greška");
      setRows([]);
      return;
    }

    setRows(r.data || []);
  }

  useEffect(() => {
    loadMeta();
  }, []);

  const cols = useMemo(
    () => (rows.length ? Object.keys(rows[0]) : []),
    [rows]
  );

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "Arial",
        overflow: "hidden",
      }}
    >
      
      <div
        style={{
          width: 280,
          borderRight: "1px solid #ccc",
          padding: 12,
          overflowY: "auto",
        }}
      >
        <h3>Tabele</h3>

        {tables.map((t) => (
          <div key={t}>
            <button
              onClick={() => loadData(t)}
              style={{
                width: "100%",
                margin: "2px 0",
                padding: "6px 8px",
                cursor: "pointer",
              }}
            >
              {t}
            </button>
          </div>
        ))}

        <h3 style={{ marginTop: 16 }}>Pogledi</h3>

        {views.map((v) => (
          <div key={v}>
            <button
              onClick={() => loadData(v)}
              style={{
                width: "100%",
                margin: "2px 0",
                padding: "6px 8px",
                cursor: "pointer",
              }}
            >
              {v}
            </button>
          </div>
        ))}
      </div>

      
      <div style={{ flex: 1, padding: 12, overflow: "hidden" }}>
        <h2 style={{ marginTop: 0 }}>
          {selected || "Izaberi tabelu/view"}
        </h2>

        {error && (
          <div
            style={{
              background: "#ffd6d6",
              padding: 10,
              marginBottom: 10,
            }}
          >
            {error}
          </div>
        )}

        {rows.length > 0 && (
          <div
            style={{
              border: "1px solid #444",
              borderRadius: 6,
              overflowX: "auto",
              maxHeight: "82vh",
            }}
          >
            <table
              border="1"
              cellPadding="6"
              style={{
                borderCollapse: "collapse",
                width: "100%",
                tableLayout: "fixed",
              }}
            >
              <thead>
                <tr>
                  {cols.map((c) => (
                    <th
                      key={c}
                      style={{
                        position: "sticky",
                        top: 0,
                        background: "#222",
                        color: "white",
                        zIndex: 1,
                        width: 160,
                        maxWidth: 160,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {rows.map((r, idx) => (
                  <tr key={idx}>
                    {cols.map((c) => (
                      <td
                        key={c}
                        style={{
                          width: 160,
                          maxWidth: 160,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {String(r[c] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selected && rows.length === 0 && !error && (
          <div>Nema podataka ili tabela/view je prazna.</div>
        )}
      </div>
    </div>
  );
}
