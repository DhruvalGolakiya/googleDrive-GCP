var express = require("express");
var router = express.Router();

const googleDriveRouter = require("./googleDrive");
const googleCloudRoute = require("./googleCloud");

// MAIN PAGE

router.get("/", (req, res) => {
  res.render("optionPage");
});

router.use("/googleDrive", googleDriveRouter);
router.use("/googleCloud", googleCloudRoute);

module.exports = router;
