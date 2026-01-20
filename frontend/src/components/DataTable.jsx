export default function DataTable({
  rows,
  displayCols,
  selectedRowId,
  onRowClick,
  getDisplayValue,
  doDelete,
}) {
  if (rows.length === 0) return null;

  return (
    <div className="tableWrap">
      <table border="1" cellPadding="6" className="table">
        <thead>
          <tr>
            {displayCols.map((c) => (
              <th key={c} className="thSticky colFixed" title={c}>
                {c}
              </th>
            ))}
            <th className="thSticky actionsCol">AKCIJE</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r) => (
            <tr
              key={r.__ROWID || JSON.stringify(r)}
              onClick={() => onRowClick(r)}
              className={`trRow ${r.__ROWID && r.__ROWID === selectedRowId ? "trSelected" : ""}`}
            >
              {displayCols.map((c) => (
                <td key={c} className="colFixed" title={getDisplayValue(r, c)}>
                  {getDisplayValue(r, c)}
                </td>
              ))}

              <td className="actionsCol">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    doDelete(r.__ROWID);
                  }}
                  className="deleteBtn"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
