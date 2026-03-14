const mongoose = require("mongoose");

// ── Sub-schema: Applicant Summary ───────────────────────────
const applicantSummarySchema = new mongoose.Schema(
  {
    income_class:    { type: String },
    credit_band:     { type: String },
    debt_to_income:  { type: Number },
  },
  { _id: false }
);

// ── Main Schema: Loan Application ───────────────────────────
const loanApplicationSchema = new mongoose.Schema(
  {
    // ── Applicant Details ──────────────────────────────────
    applicant_id: {
      type:    String,
      default: () => `APP-${Date.now()}`,
    },
    age:              { type: Number, required: true },
    gender:           { type: String, enum: ["Male", "Female", "Other"] },
    marital_status:   { type: String, enum: ["Married", "Single", "Divorced"] },
    annual_income:    { type: Number, required: true },
    employment_years: { type: Number, default: 0 },
    education_level:  { type: String, enum: ["None", "Undergraduate", "Graduate", "Postgraduate"] },
    property_ownership: { type: String, enum: ["None", "Rent", "Own"] },
    existing_loans:   { type: Number, default: 0 },
    dependents:       { type: Number, default: 0 },
    monthly_expenses: { type: Number, default: 0 },
    savings_balance:  { type: Number, default: 0 },

    // ── Loan Details ───────────────────────────────────────
    loan_amount:      { type: Number, required: true },
    loan_term_months: { type: Number, default: 12 },
    loan_purpose: {
      type: String,
      enum: ["Home", "Education", "Business", "Vehicle", "Personal", "Medical"],
    },
    credit_score:     { type: Number, required: true },

    // ── ML Prediction Result ───────────────────────────────
    decision:         { type: String, enum: ["APPROVED", "REJECTED", "PENDING"], default: "PENDING" },
    approved:         { type: Boolean },
    probability:      { type: Number },
    confidence:       { type: String },
    risk_category:    { type: String, enum: ["Low", "Medium", "High"] },
    model_mode:       { type: String, default: "demo" },
    applicant_summary: applicantSummarySchema,
  },
  {
    timestamps: true,   // adds createdAt, updatedAt automatically
  }
);

// ── Indexes ──────────────────────────────────────────────────
loanApplicationSchema.index({ applicant_id: 1 });
loanApplicationSchema.index({ decision: 1 });
loanApplicationSchema.index({ createdAt: -1 });
loanApplicationSchema.index({ credit_score: 1, annual_income: 1 });

module.exports = mongoose.model("LoanApplication", loanApplicationSchema);