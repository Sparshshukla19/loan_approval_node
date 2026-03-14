const express = require("express");
const router  = express.Router();
const {
  predict,
  batchPredict,
  getApplications,
  getApplicationById,
  deleteApplication,
} = require("../controllers/loanController");

router.post("/predict",          predict);
router.post("/batch-predict",    batchPredict);
router.get("/applications",      getApplications);
router.get("/applications/:id",  getApplicationById);
router.delete("/applications/:id", deleteApplication);

module.exports = router;