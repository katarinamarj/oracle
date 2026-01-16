const express = require("express");
const router = express.Router();
const { oracledb, getConn } = require("../db");


function safeName(name) {
  if (!/^[A-Z0-9_]+$/i.test(name)) {
    throw new Error("Neispravno ime tabele ili pogleda.");
  }
  return name;
}


router.get("/:name", async (req, res) => {
  let conn;
  try {
    const name = safeName(req.params.name);

    conn = await getConn();
    const sql = `SELECT * FROM ${name}`;
    const r = await conn.execute(
      sql,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json({ ok: true, data: r.rows });
  } catch (err) {
    res.status(400).json({
      ok: false,
      error: { message: err.message }
    });
  } finally {
    if (conn) await conn.close();
  }
});




module.exports = router;
