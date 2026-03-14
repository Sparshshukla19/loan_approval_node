const { getModelMeta } = require("../ml/modelBridge");

const FEATURE_ORDER = [
  "age", "gender", "marital_status", "annual_income",
  "employment_years", "credit_score", "loan_amount",
  "loan_term_months", "loan_purpose", "existing_loans",
  "dependents", "education_level", "property_ownership",
  "monthly_expenses", "savings_balance",
];

// GET /api/model/health
const health = (req, res) => {
  const meta = getModelMeta();
  res.json({
    status:      "healthy",
    model_ready:  meta.loaded,
    timestamp:    new Date().toISOString(),
  });
};

// GET /api/model/info
const modelInfo = (req, res) => {
  const meta = getModelMeta();
  res.json({
    ...meta,
    features: FEATURE_ORDER,
    classes:  ["Rejected (0)", "Approved (1)"],
    note: meta.loaded
      ? "Model is live."
      : "Model not yet loaded — update src/ml/modelBridge.js to plug in your trained model.",
  });
};

module.exports = { health, modelInfo };