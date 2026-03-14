const express = require("express");
const cors    = require("cors");
const morgan  = require("morgan");

const loanRoutes  = require("./routes/loanRoutes");
const modelRoutes = require("./routes/modelRoutes");

const app = express();

// ── Middleware ───────────────────────────────
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// ── Routes ──────────────────────────────────
app.use("/api/loan",  loanRoutes);
app.use("/api/model", modelRoutes);

// ── Root ────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    service: "Loan Approval System API",
    version: "1.0.0",
    status:  "running",
    endpoints: {
      "POST /api/loan/predict":       "Single loan application prediction",
      "POST /api/loan/batch-predict": "Batch loan predictions",
      "GET  /api/loan/applications":  "All saved applications",
      "GET  /api/loan/applications/:id": "Single application by ID",
      "GET  /api/model/info":         "Model metadata",
      "GET  /api/model/health":       "Health check",
    },
  });
});

// ── Global Error Handler ─────────────────────
app.use((err, req, res, next) => {
  console.error(" Unhandled Error:", err.message);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

module.exports = app;