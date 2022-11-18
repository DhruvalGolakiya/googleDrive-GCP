var express = require("express");
var router = express.Router();
const multer = require("../../config/multerConfig");
router.get("/", (req, res) => {
  res.render("GCloud");
});
const path = require("path");
const serviceKey = path.join(__dirname, "../../keys.json");
const { Storage } = require("@google-cloud/storage");
const storage = new Storage({
  keyFilename: serviceKey,
  projectId: "peaceful-rex-368804",
});
const bucket = storage.bucket("peaceful-rex-368804.appspot.com");

router.get("/uploadToBucket", (req, res) => {
  res.render("gcpUpload");
});

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

module.exports = router;
