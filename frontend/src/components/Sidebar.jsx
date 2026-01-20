export default function Sidebar({ tables, views, selected, onSelect }) {
  return (
    <div className="sidebar">
      <h3 className="sidebarTitle">Tabele</h3>
      {tables.map((t) => (
        <div key={t} className="sidebarItem">
          <button
            onClick={() => onSelect(t)}
            className={`sidebarButton ${selected === t ? "sidebarButtonActive" : ""}`}
          >
            {t}
          </button>
        </div>
      ))}

      {views.map((v) => (
        <div key={v} className="sidebarItem">
          <button
            onClick={() => onSelect(v)}
            className={`sidebarButton ${selected === v ? "sidebarButtonActive" : ""}`}
          >
            {v}
          </button>
        </div>
      ))}
    </div>
  );
}
