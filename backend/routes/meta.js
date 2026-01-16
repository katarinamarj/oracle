const express = require("express");
const router = express.Router();
const { oracledb, getConn } = require("../db");

router.get("/tables", async (req, res) => {
  let conn;
  try {
    conn = await getConn();
    const r = await conn.execute(
      `SELECT table_name AS name FROM user_tables ORDER BY table_name`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json({ ok: true, data: r.rows.map(x => x.NAME) });
  } catch (err) {
    res.status(400).json({ ok: false, error: { message: err.message } });
  } finally {
    if (conn) await conn.close();
  }
});

router.get("/views", async (req, res) => {
  let conn;
  try {
    conn = await getConn();
    const r = await conn.execute(
      `SELECT view_name AS name FROM user_views ORDER BY view_name`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json({ ok: true, data: r.rows.map(x => x.NAME) });
  } catch (err) {
    res.status(400).json({ ok: false, error: { message: err.message } });
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;
