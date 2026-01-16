const oracledb = require("oracledb");

const dbConfig = {
  user: process.env.DB_USER || "vulkanizer",
  password: process.env.DB_PASSWORD || "vulkanizer",
  connectString: process.env.DB_CONNECT || "localhost/XEPDB1",
};

async function initPool() {
  await oracledb.createPool({
    ...dbConfig,
    poolMin: 1,
    poolMax: 5,
    poolIncrement: 1,
  });
  console.log("Oracle pool ready ✅");
}

async function getConn() {
  return await oracledb.getConnection();
}

module.exports = { oracledb, initPool, getConn };
