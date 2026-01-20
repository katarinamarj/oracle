export default function DataForm({
  selected,
  editableCols,
  form,
  setForm,
  isStavkaIzvestaja,
  setTechField,
  doInsert,
  doUpdate,
  onClear,
}) {
  return (
    <div className="formCard">
      <div className="formRow">
        {editableCols.map((c) => (
          <input
            key={c}
            placeholder={c}
            value={form[c] ?? ""}
            onChange={(e) => setForm({ ...form, [c]: e.target.value })}
            className="input"
          />
        ))}

        {isStavkaIzvestaja && (
          <div className="techBox">
            <input
              placeholder="KILOMETRAZA"
              value={form.TEHNICKIPODACI?.KILOMETRAZA ?? ""}
              onChange={(e) => setTechField("KILOMETRAZA", e.target.value)}
              className="input"
            />
            <input
              placeholder="PRITISAK"
              value={form.TEHNICKIPODACI?.PRITISAK ?? ""}
              onChange={(e) => setTechField("PRITISAK", e.target.value)}
              className="input"
            />
            <input
              placeholder="DOT"
              value={form.TEHNICKIPODACI?.DOT ?? ""}
              onChange={(e) => setTechField("DOT", e.target.value)}
              className="input"
            />
            <input
              placeholder="DUBINA_GUME"
              value={form.TEHNICKIPODACI?.DUBINA_GUME ?? ""}
              onChange={(e) => setTechField("DUBINA_GUME", e.target.value)}
              className="input"
            />
          </div>
        )}

        <button onClick={doInsert} className="btn">
          INSERT
        </button>
        <button onClick={doUpdate} className="btn">
          UPDATE
        </button>

        <button onClick={onClear} className="btn btnClear">
          CLEAR
        </button>
      </div>
    </div>
  );
}
