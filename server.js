const app = require("./src/app");
const connectDB = require("./src/config/db");
const { loadModel } = require("./src/ml/modelBridge");
 
const PORT = process.env.PORT || 5000;
 
(async () => {
  await connectDB();   // Connect to MongoDB
  await loadModel();   // Load ML model on startup
 
  app.listen(PORT, () => {
    console.log("━".repeat(50));
    console.log("Loan Approval System — Node.js Backend");
    console.log(`Server running on http://localhost:${PORT}`);
    console.log("━".repeat(50));
  });
})();