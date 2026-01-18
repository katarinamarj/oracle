const express = require("express");
const router = express.Router();
const { oracledb, getConn } = require("../db");

function validateName(name) {
  if (!/^[A-Z0-9_]+$/i.test(name)) {
    throw new Error("Neispravno ime tabele ili pogleda.");
  }
  return name;
}

function isSpecialObjectType(tableName, colName) {
  const t = tableName.toUpperCase();
  const c = colName.toUpperCase();

  if (t === "GUMA" && c === "SERIJSKIBROJ") return "VULKANIZER.SERIJSKIBROJ_T";
  if (t === "STAVKAIZVESTAJA" && c === "TEHNICKIPODACI")
    return "VULKANIZER.TEHNICKIPODACIGUME_T";

  return null;
}

function isDateColumn(colName) {
  const c = colName.toUpperCase();
  return c.startsWith("DATUM") || c.includes("VREME");
}

function normalizeDate(val) {
  if (typeof val !== "string") return val;
  return val.trim().replace(/\.$/, "");
}

function normalizeBindValue(v) {
  if (v === "") return null;
  return v;
}

router.get("/:name", async (req, res) => {
  let conn;
  try {
    const name = validateName(req.params.name);
    conn = await getConn();

    try {
      const sql = `SELECT t.*, ROWIDTOCHAR(t.ROWID) AS "__ROWID" FROM ${name} t`;
      const r = await conn.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
      return res.json({ ok: true, data: r.rows });
    } catch (e) {
      const sql2 = `SELECT * FROM ${name}`;
      const r2 = await conn.execute(sql2, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
      return res.json({ ok: true, data: r2.rows });
    }
  } catch (err) {
    res.status(400).json({ ok: false, error: { message: err.message } });
  } finally {
    if (conn) await conn.close();
  }
});

router.post("/:name", async (req, res) => {
  let conn;

  try {
    const name = validateName(req.params.name);
    const values = req.body.values || {};

    const cols = Object.keys(values);
    if (cols.length === 0) throw new Error("Nema vrednosti za INSERT.");

    const binds = {};

    const placeholders = cols.map((c, i) => {
      const colU = c.toUpperCase();

      if (name.toUpperCase() === "STAVKAIZVESTAJA" && colU === "TEHNICKIPODACI") {
        const obj = values[c];
        if (!obj || typeof obj !== "object") {
          throw new Error("TEHNICKIPODACI mora biti objekat.");
        }

        binds.km = normalizeBindValue(obj.KILOMETRAZA);
        binds.pr = normalizeBindValue(obj.PRITISAK);
        binds.dot = normalizeBindValue(obj.DOT);
        binds.dg = normalizeBindValue(obj.DUBINA_GUME);

        return `VULKANIZER.TEHNICKIPODACIGUME_T(:km, :pr, :dot, :dg)`;
      }

      const key = `b${i}`;
      let v = values[c];

      if (isDateColumn(c)) v = normalizeDate(v);

      binds[key] = normalizeBindValue(v);

      const ot = isSpecialObjectType(name, c);
      if (ot) {
        return `${ot}(:${key})`;
      }

      if (isDateColumn(c)) {
        return `TO_DATE(:${key}, 'DD.MM.YYYY')`;
      }

      return `:${key}`;
    });

    const sql = `INSERT INTO ${name} (${cols.join(", ")}) VALUES (${placeholders.join(", ")})`;

    conn = await getConn();
    await conn.execute(sql, binds, { autoCommit: true });

    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: { message: err.message } });
  } finally {
    if (conn) await conn.close();
  }
});

router.put("/:name/:rowid", async (req, res) => {
  let conn;
  try {
    const name = validateName(req.params.name);
    const rowid = req.params.rowid;

    const values = req.body.values || {};
    delete values.__ROWID;

    const cols = Object.keys(values);
    if (cols.length === 0) throw new Error("Nema vrednosti za UPDATE.");

    conn = await getConn();

    const binds = { rid: rowid };
    const setParts = [];

    const hasTehnicki = cols.some((c) => c.toUpperCase() === "TEHNICKIPODACI");

    if (name.toUpperCase() === "STAVKAIZVESTAJA" && hasTehnicki) {
      const oldQ = await conn.execute(
        `SELECT t.TEHNICKIPODACI.KILOMETRAZA AS KILOMETRAZA,
                t.TEHNICKIPODACI.PRITISAK    AS PRITISAK,
                t.TEHNICKIPODACI.DOT         AS DOT,
                t.TEHNICKIPODACI.DUBINA_GUME AS DUBINA_GUME
         FROM STAVKAIZVESTAJA t
         WHERE ROWID = CHARTOROWID(:rid)`,
        { rid: rowid },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      const oldT = oldQ.rows?.[0] || {};

      let obj = values.TEHNICKIPODACI;
      if (typeof obj === "string") {
        try { obj = JSON.parse(obj); } catch {}
      }
      if (!obj || typeof obj !== "object") obj = {};

      const merged = {
        KILOMETRAZA: obj.KILOMETRAZA ?? oldT.KILOMETRAZA ?? null,
        PRITISAK: obj.PRITISAK ?? oldT.PRITISAK ?? null,
        DOT: obj.DOT ?? oldT.DOT ?? null,
        DUBINA_GUME: obj.DUBINA_GUME ?? oldT.DUBINA_GUME ?? null,
      };

      binds.km = normalizeBindValue(merged.KILOMETRAZA);
      binds.pr = normalizeBindValue(merged.PRITISAK);
      binds.dot = normalizeBindValue(merged.DOT);
      binds.dg = normalizeBindValue(merged.DUBINA_GUME);

      setParts.push(`TEHNICKIPODACI = VULKANIZER.TEHNICKIPODACIGUME_T(:km, :pr, :dot, :dg)`);

      delete values.TEHNICKIPODACI;
    }

    const restCols = Object.keys(values);
    restCols.forEach((c, i) => {
      const key = `b${i}`;
      let v = values[c];

      if (isDateColumn(c)) v = normalizeDate(v);

      binds[key] = normalizeBindValue(v);

      const ot = isSpecialObjectType(name, c);
      if (ot) {
        setParts.push(`${c} = ${ot}(:${key})`);
        return;
      }

      if (isDateColumn(c)) {
        setParts.push(`${c} = TO_DATE(:${key}, 'DD.MM.YYYY')`);
        return;
      }

      setParts.push(`${c} = :${key}`);
    });

    if (setParts.length === 0) throw new Error("Nema validnih kolona za UPDATE.");

    const sql = `UPDATE ${name} SET ${setParts.join(", ")} WHERE ROWID = CHARTOROWID(:rid)`;
    const r = await conn.execute(sql, binds, { autoCommit: true });

    if ((r.rowsAffected || 0) === 0) throw new Error("Nijedan red nije ažuriran.");

    res.json({ ok: true, rowsAffected: r.rowsAffected });
  } catch (err) {
    try { if (conn) await conn.rollback(); } catch {}
    res.status(400).json({ ok: false, error: { message: err.message } });
  } finally {
    if (conn) await conn.close();
  }
});

router.delete("/:name/:rowid", async (req, res) => {
  let conn;
  try {
    const name = validateName(req.params.name);
    const rowid = req.params.rowid;

    conn = await getConn();
    const sql = `DELETE FROM ${name} WHERE ROWID = CHARTOROWID(:rid)`;
    const r = await conn.execute(sql, { rid: rowid }, { autoCommit: true });

    if ((r.rowsAffected || 0) === 0) throw new Error("Nijedan red nije obrisan.");

    res.json({ ok: true, rowsAffected: r.rowsAffected });
  } catch (err) {
    res.status(400).json({ ok: false, error: { message: err.message } });
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;
