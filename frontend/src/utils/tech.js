export function emptyTech() {
  return { KILOMETRAZA: "", PRITISAK: "", DOT: "", DUBINA_GUME: "" };
}

export function getTechFromRow(row) {
  const t = row?.TEHNICKIPODACI;

  if (typeof t === "string") {
    try {
      const parsed = JSON.parse(t);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {}
  }

  if (t && typeof t === "object") return t;

  return emptyTech();
}

export function normalizeTechForSubmit(t) {
  const obj = t && typeof t === "object" ? t : emptyTech();

  return {
    KILOMETRAZA: obj.KILOMETRAZA === "" ? null : Number(obj.KILOMETRAZA),
    PRITISAK: obj.PRITISAK === "" ? null : Number(obj.PRITISAK),
    DOT: obj.DOT === "" || obj.DOT === null ? null : String(obj.DOT),
    DUBINA_GUME: obj.DUBINA_GUME === "" ? null : Number(obj.DUBINA_GUME),
  };
}

export function techChanged(oldT, newT) {
  return (
    String(oldT.KILOMETRAZA ?? "") !== String(newT.KILOMETRAZA ?? "") ||
    String(oldT.PRITISAK ?? "") !== String(newT.PRITISAK ?? "") ||
    String(oldT.DOT ?? "") !== String(newT.DOT ?? "") ||
    String(oldT.DUBINA_GUME ?? "") !== String(newT.DUBINA_GUME ?? "")
  );
}
