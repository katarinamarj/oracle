const express = require("express");
const cors = require("cors");
const { initPool } = require("./db");

const metaRoutes = require("./routes/meta");
const dataRoutes = require("./routes/data");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/meta", metaRoutes);
app.use("/api/data", dataRoutes);

const PORT = 4000;

initPool()
  .then(() => {
    app.listen(PORT, () => console.log(`API on http://localhost:${PORT} ✅`));
  })
  .catch((err) => {
    console.error("Oracle pool init error:", err);
    process.exit(1);
  });
