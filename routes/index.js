const express = require("express");
const router = express.Router();
const googleDriveRouter = require("./googleDrive");
const googleCloudRoute = require("./googleCloud");

// HOME PAGE
router.get("/", (req, res) => {
  res.render("optionPage");
});

// ROUTES
router.use("/googleDrive", googleDriveRouter); // drive 
router.use("/googleCloud", googleCloudRoute); // cloud

module.exports = router;
