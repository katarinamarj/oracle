export function formatDateDDMMYYYYDot(val) {
  if (!val) return "";
  if (val instanceof Date) {
    const dd = String(val.getDate()).padStart(2, "0");
    const mm = String(val.getMonth() + 1).padStart(2, "0");
    const yyyy = val.getFullYear();
    return `${dd}.${mm}.${yyyy}.`;
  }

  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      return `${dd}.${mm}.${yyyy}.`;
    }
  }

  return String(val);
}

export function isIsoDateString(v) {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v);
}

export function isDateColumn(colName) {
  const c = colName.toUpperCase();
  return c.startsWith("DATUM") || c.includes("VREME");
}

export function formatCell(val) {
  if (val === null || val === undefined) return "";

  if (val instanceof Date) return formatDateDDMMYYYYDot(val);
  if (isIsoDateString(val)) return formatDateDDMMYYYYDot(val);

  if (typeof val === "object") {
    if ("VREDNOST" in val) return String(val.VREDNOST ?? "");
    if ("VALUE" in val) return String(val.VALUE ?? "");
    try {
      return JSON.stringify(val);
    } catch {
      return "[object]";
    }
  }

  return String(val);
}

export function toInputValue(val) {
  if (val === null || val === undefined) return "";

  if (val instanceof Date) return formatDateDDMMYYYYDot(val);
  if (isIsoDateString(val)) return formatDateDDMMYYYYDot(val);

  if (typeof val === "object") {
    if ("VREDNOST" in val) return String(val.VREDNOST ?? "");
    if ("VALUE" in val) return String(val.VALUE ?? "");
    return "";
  }

  return String(val);
}
