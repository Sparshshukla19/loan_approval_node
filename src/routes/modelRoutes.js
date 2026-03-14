const express = require("express");
const router  = express.Router();
const { health, modelInfo } = require("../controllers/modelController");

router.get("/health", health);
router.get("/info",   modelInfo);

module.exports = router;