const express = require("express");
const cors = require("cors");
const { initPool } = require("./db");

const metaRoutes = require("./routes/meta");
const dataRoutes = require("./routes/data");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/meta", metaRoutes);
app.use("/api/data", dataRoutes);

const PORT = 4000;

initPool()
  .then(() => {
    app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
