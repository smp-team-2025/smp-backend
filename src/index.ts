import { pool } from "./db";
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    const result = await pool.query("SELECT 1");
    res.json({ status: "ok", db: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", db: "connection failed" });
  }
});

app.get("/api/users", async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, role, created_at FROM users ORDER BY id"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch users" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});