const express = require("express");
const router = express.Router();
const util = require("util");
const multer = require("../../config/multerConfig");
const path = require("path");
const serviceKey = path.join(__dirname, "../../keys.json");
const { Storage } = require("@google-cloud/storage");

// INIT STORAGE
const storage = new Storage({
  keyFilename: serviceKey, //
  projectId: process.env.PROJECT_ID,
});

// INIT BUCKET
const bucket = storage.bucket("peaceful-rex-368804.appspot.com"); // bucket name

// CLOUD HOME PAGE
router.get("/", (req, res) => {
  res.render("GCloud");
});

// UPLOAD TO BUCKET  PAGE
router.get("/uploadToBucket", (req, res) => {
  res.render("gcpUpload");
});

// UPLOAD FILE TO BUCKET
router.post("/uploadToBucket", multer.single("file"), (req, res, next) => {
  if (!req.file) {
    res.status(400).send("No file uploaded.");
    return;
  }

  const blob = bucket.file(req.file.originalname);
  const blobStream = blob.createWriteStream();

  blobStream.on("error", (err) => {
    next(err);
  });
  console.log(bucket.name);
  console.log(blob.name);
  blobStream.on("finish", () => {
    const publicUrl = util.format(
      `https://storage.googleapis.com/${bucket.name}/${blob.name}`
    );
    res
      .status(200)
      .send(`file ${blob.name} uploaded successfu lly in ${bucket.name}`);
  });

  blobStream.end(req.file.buffer);
});

// LOGOUT
router.get("/logout", (req, res) => {
  res.redirect("/google/googleCloud");
});

module.exports = router;
