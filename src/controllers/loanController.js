const LoanApplication  = require("../models/LoanApplication");
const {
  runInference,
  preprocessInput,
  classifyIncome,
  classifyCredit,
  getModelMeta,
} = require("../ml/modelBridge");

// ─────────────────────────────────────────────────────────────
//  POST /api/loan/predict
//  Single loan application — predict + save to MongoDB
// ─────────────────────────────────────────────────────────────
const predict = async (req, res) => {
  try {
    const data = req.body;

    // Validate required fields
    const required = ["age", "annual_income", "credit_score", "loan_amount"];
    const missing  = required.filter((f) => data[f] === undefined);
    if (missing.length) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(", ")}` });
    }

    // Preprocess → infer
    const features = preprocessInput(data);
    const result   = await runInference(features);

    const meta     = getModelMeta();
    const income   = Number(data.annual_income);
    const loan     = Number(data.loan_amount);

    const responsePayload = {
      status:       "success",
      decision:     result.approved ? "APPROVED" : "REJECTED",
      approved:     result.approved,
      confidence:   `${(result.probability * 100).toFixed(1)}%`,
      probability:  result.probability,
      risk_category: result.risk_category,
      applicant_summary: {
        income_class:   classifyIncome(income),
        credit_band:    classifyCredit(Number(data.credit_score)),
        debt_to_income: parseFloat((loan / Math.max(income, 1)).toFixed(4)),
      },
      model_mode: meta.loaded ? "live" : "demo (no model loaded)",
      timestamp:  new Date().toISOString(),
    };

    // ── Save to MongoDB ──────────────────────────────────────
    const application = new LoanApplication({
      ...data,
      decision:          responsePayload.decision,
      approved:          result.approved,
      probability:       result.probability,
      confidence:        responsePayload.confidence,
      risk_category:     result.risk_category,
      model_mode:        responsePayload.model_mode,
      applicant_summary: responsePayload.applicant_summary,
    });

    const saved = await application.save();
    responsePayload.application_id = saved._id;

    console.log(`📋  ${responsePayload.decision} | Score: ${result.probability} | ID: ${saved._id}`);
    return res.status(200).json(responsePayload);

  } catch (err) {
    console.error("❌  predict error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
//  POST /api/loan/batch-predict
//  Multiple applications at once
// ─────────────────────────────────────────────────────────────
const batchPredict = async (req, res) => {
  try {
    const { applications } = req.body;
    if (!Array.isArray(applications) || applications.length === 0) {
      return res.status(400).json({ error: "Provide a non-empty 'applications' array" });
    }

    const results = [];
    const docs    = [];

    for (let i = 0; i < applications.length; i++) {
      const appData  = applications[i];
      const features = preprocessInput(appData);
      const result   = await runInference(features);

      const entry = {
        index:        i,
        applicant_id: appData.applicant_id || `APP-${String(i + 1).padStart(4, "0")}`,
        decision:     result.approved ? "APPROVED" : "REJECTED",
        probability:  result.probability,
        risk_category: result.risk_category,
      };

      results.push(entry);
      docs.push({
        ...appData,
        applicant_id:  entry.applicant_id,
        decision:      entry.decision,
        approved:      result.approved,
        probability:   result.probability,
        risk_category: result.risk_category,
      });
    }

    // Bulk insert into MongoDB
    await LoanApplication.insertMany(docs, { ordered: false });

    const approvedCount = results.filter((r) => r.decision === "APPROVED").length;

    return res.status(200).json({
      status:        "success",
      total:          results.length,
      approved:       approvedCount,
      rejected:       results.length - approvedCount,
      approval_rate: `${((approvedCount / results.length) * 100).toFixed(1)}%`,
      results,
    });

  } catch (err) {
    console.error("❌  batchPredict error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/loan/applications
//  Retrieve all saved applications (with filtering & pagination)
// ─────────────────────────────────────────────────────────────
const getApplications = async (req, res) => {
  try {
    const {
      page     = 1,
      limit    = 20,
      decision,        // "APPROVED" | "REJECTED"
      risk,            // "Low" | "Medium" | "High"
      min_income,
      max_income,
    } = req.query;

    const filter = {};
    if (decision)   filter.decision      = decision.toUpperCase();
    if (risk)       filter.risk_category = risk;
    if (min_income || max_income) {
      filter.annual_income = {};
      if (min_income) filter.annual_income.$gte = Number(min_income);
      if (max_income) filter.annual_income.$lte = Number(max_income);
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await LoanApplication.countDocuments(filter);
    const docs  = await LoanApplication.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select("-__v");

    return res.status(200).json({
      status: "success",
      total,
      page:   Number(page),
      pages:  Math.ceil(total / Number(limit)),
      data:   docs,
    });

  } catch (err) {
    console.error("❌  getApplications error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/loan/applications/:id
//  Single application by MongoDB _id
// ─────────────────────────────────────────────────────────────
const getApplicationById = async (req, res) => {
  try {
    const doc = await LoanApplication.findById(req.params.id).select("-__v");
    if (!doc) return res.status(404).json({ error: "Application not found" });
    return res.status(200).json({ status: "success", data: doc });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
//  DELETE /api/loan/applications/:id
// ─────────────────────────────────────────────────────────────
const deleteApplication = async (req, res) => {
  try {
    const doc = await LoanApplication.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: "Application not found" });
    return res.status(200).json({ status: "success", message: "Deleted successfully" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { predict, batchPredict, getApplications, getApplicationById, deleteApplication };