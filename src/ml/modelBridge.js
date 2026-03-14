// ================================================================
//   ML MODEL BRIDGE
//   This file is the integration point for your trained ML model.
//
//   Node.js cannot load .pkl / .h5 / .pt files directly.
//   The recommended approach is a Python microservice or child
//   process that handles inference, while Node handles routing
//   and MongoDB persistence.
//
//   Three options are provided below — choose one.
// ================================================================

const path = require("path");

// ── Model state ─────────────────────────────────────────────
let modelLoaded = false;
let modelMeta   = {
  name:       "< YOUR MODEL NAME >",    // e.g. "RandomForestClassifier"
  version:    "< YOUR VERSION >",       // e.g. "v1.2"
  trained_on: "< TRAINING DATE >",      // e.g. "2025-01-15"
  framework:  "< FRAMEWORK >",          // e.g. "scikit-learn"
};

// ════════════════════════════════════════════════════════════════
//
//   🤖  VACANT SPACE — PLUG YOUR TRAINED MODEL IN HERE
//
// ════════════════════════════════════════════════════════════════

/**
 * loadModel()
 * Called once at server startup.
 * Uncomment the option matching your model type.
 */
const loadModel = async () => {

  // ──────────────────────────────────────────────────────────
  //  OPTION 1: Python Microservice (Recommended)
  //  Run a separate Flask/FastAPI server that loads the .pkl
  //  and exposes a /infer endpoint. Node calls it via HTTP.
  //  Start with: python model_server.py
  // ──────────────────────────────────────────────────────────
  // const { default: axios } = await import("axios");
  // try {
  //   const res = await axios.get("http://localhost:8000/health");
  //   modelLoaded = res.data.model_loaded;
  //   modelMeta   = res.data.meta;
  //   console.log("✅  Python model server connected");
  // } catch {
  //   console.warn("⚠️   Python model server not reachable — running in demo mode");
  // }

  // ──────────────────────────────────────────────────────────
  //  OPTION 2: python-shell (child process, inline)
  //  npm install python-shell
  //  Place your .pkl at: models/loan_approval_model.pkl
  // ──────────────────────────────────────────────────────────
  // const { PythonShell } = require("python-shell");
  // PythonShell.run("scripts/load_model.py", null, (err, result) => {
  //   if (err) { console.warn("⚠️  python-shell failed:", err.message); return; }
  //   modelLoaded = true;
  //   console.log("✅  Model loaded via python-shell:", result);
  // });

  // ──────────────────────────────────────────────────────────
  //  OPTION 3: ONNX Runtime for Node.js (no Python needed)
  //  Export your model to ONNX, then:
  //  npm install onnxruntime-node
  //  Place your model at: models/loan_approval_model.onnx
  // ──────────────────────────────────────────────────────────
  // const ort = require("onnxruntime-node");
  // try {
  //   global.onnxSession = await ort.InferenceSession.create(
  //     path.join(__dirname, "../../models/loan_approval_model.onnx")
  //   );
  //   modelLoaded = true;
  //   console.log("✅  ONNX model loaded");
  // } catch (err) {
  //   console.warn("⚠️  ONNX load failed:", err.message);
  // }

  console.warn("⚠️   No model loaded — running in demo mode. Plug in your model in src/ml/modelBridge.js");
};


/**
 * runInference(features)
 * ════════════════════════════════════════════════════════════════
 * VACANT SPACE: Replace demo logic with your model inference call.
 *
 * @param {number[]} features — preprocessed numeric feature array
 *                              in the exact order model was trained
 * @returns {{ approved: boolean, probability: number, risk_category: string }}
 * ════════════════════════════════════════════════════════════════
 */
const runInference = async (features) => {

  // ──────────────────────────────────────────────────────────
  //  OPTION 1: Call Python microservice
  // ──────────────────────────────────────────────────────────
  // const { default: axios } = await import("axios");
  // const res = await axios.post("http://localhost:8000/infer", { features });
  // return res.data;   // expects { approved, probability, risk_category }

  // ──────────────────────────────────────────────────────────
  //  OPTION 2: python-shell per-request
  // ──────────────────────────────────────────────────────────
  // return new Promise((resolve, reject) => {
  //   const { PythonShell } = require("python-shell");
  //   const opts = { mode: "json", args: [JSON.stringify(features)] };
  //   PythonShell.run("scripts/infer.py", opts, (err, results) => {
  //     if (err) reject(err);
  //     else resolve(results[0]);
  //   });
  // });

  // ──────────────────────────────────────────────────────────
  //  OPTION 3: ONNX Runtime
  // ──────────────────────────────────────────────────────────
  // const ort   = require("onnxruntime-node");
  // const input = new ort.Tensor("float32", Float32Array.from(features), [1, features.length]);
  // const feeds = { [global.onnxSession.inputNames[0]]: input };
  // const out   = await global.onnxSession.run(feeds);
  // const prob  = out[global.onnxSession.outputNames[0]].data[0];
  // return {
  //   approved:      prob >= 0.5,
  //   probability:   parseFloat(prob.toFixed(4)),
  //   risk_category: prob > 0.75 ? "Low" : prob > 0.45 ? "Medium" : "High",
  // };

  // ── DEMO MODE (remove once real model is plugged in) ──────
  const annualIncome  = features[3];
  const creditScore   = features[5];
  const loanAmount    = features[6];
  const debtRatio     = loanAmount / (annualIncome + 1);

  const approved      = creditScore >= 650 && debtRatio <= 0.5 && annualIncome >= 300000;
  const probability   = Math.min(0.95, Math.max(0.05, creditScore / 900 - debtRatio * 0.3));
  const risk_category = probability > 0.75 ? "Low" : probability > 0.45 ? "Medium" : "High";

  return { approved, probability: parseFloat(probability.toFixed(4)), risk_category };
};


// ── Feature encoding & preprocessing ────────────────────────

const ENCODINGS = {
  gender:             { Male: 1, Female: 0, Other: 0 },
  marital_status:     { Married: 1, Single: 0, Divorced: 0 },
  loan_purpose:       { Home: 0, Education: 1, Business: 2, Vehicle: 3, Personal: 4, Medical: 5 },
  education_level:    { None: 0, Undergraduate: 1, Graduate: 2, Postgraduate: 3 },
  property_ownership: { None: 0, Rent: 1, Own: 2 },
};

const preprocessInput = (data) => {
  const enc = (key, val) => (ENCODINGS[key]?.[val] ?? 0);

  return [
    Number(data.age              ?? 30),
    enc("gender",             data.gender),
    enc("marital_status",     data.marital_status),
    Number(data.annual_income    ?? 0),
    Number(data.employment_years ?? 0),
    Number(data.credit_score     ?? 600),
    Number(data.loan_amount      ?? 0),
    Number(data.loan_term_months ?? 12),
    enc("loan_purpose",       data.loan_purpose),
    Number(data.existing_loans   ?? 0),
    Number(data.dependents        ?? 0),
    enc("education_level",    data.education_level),
    enc("property_ownership", data.property_ownership),
    Number(data.monthly_expenses ?? 0),
    Number(data.savings_balance  ?? 0),
  ];
};

// ── Helper classifiers ───────────────────────────────────────

const classifyIncome = (income) => {
  if (income < 200000)  return "Below Poverty Line";
  if (income < 500000)  return "Lower Income";
  if (income < 1000000) return "Middle Class";
  if (income < 2500000) return "Upper Middle Class";
  return "High Income";
};

const classifyCredit = (score) => {
  if (score < 580) return "Poor";
  if (score < 670) return "Fair";
  if (score < 740) return "Good";
  if (score < 800) return "Very Good";
  return "Excellent";
};

module.exports = {
  loadModel,
  runInference,
  preprocessInput,
  classifyIncome,
  classifyCredit,
  getModelMeta: () => ({ ...modelMeta, loaded: modelLoaded }),
};