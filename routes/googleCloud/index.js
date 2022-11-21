const express = require("express");
const router = express.Router();
const util = require("util");
const multer = require("../../config/multerConfig");
const path = require("path");
const serviceKey = path.join(__dirname, "../../keys.json");
const { google } = require("googleapis");

const { Storage } = require("@google-cloud/storage");
const Oauth2Data = require("../../credential.json");
const CLIENT_ID = Oauth2Data.web.client_id;
const CLIENT_SECRET = Oauth2Data.web.client_secret;
// const { REDIRECT_URI } = require("../../config/config");
const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  (REDIRECT_URI =
    "https://peaceful-rex-368804.uc.r.appspot.com/google/googleCloud/callback")
);
// INIT STORAGE
const storage = new Storage({
  keyFilename: serviceKey, //
  projectId: process.env.PROJECT_ID,
});

const SCOPES =
  "https://www.googleapis.com/auth/iam https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/devstorage.full_control";
var authed = false;
// INIT BUCKET
const bucket = storage.bucket("peaceful-rex-368804.appspot.com"); // bucket name

// CLOUD HOME PAGE
router.get("/", function (req, res, next) {
  if (!authed) {
    var url = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });
    console.log("url");
    console.log(url);
    res.render("GCloud", { url: url });
  } else {
    res.render("successForCloud");``
  }
});

// UPLOAD TO BUCKET  PAGE
router.get("/uploadToBucket", (req, res) => {
  res.render("gcpUpload");
});
router.get("/callback", (req, res) => {
  const code = req.query.code;
  console.log("code");
  if (code) {
    oAuth2Client.getToken(code, (err, token) => {
      if (err) {
        console.log("Error");
        console.log(err);
      } else {
        console.log("Success");
        console.log(token);
        oAuth2Client.setCredentials(token);
        authed = true;
        res.redirect("/google/googleCloud");
      }
    });
  } else {
    res.send("INVALID");
  }
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
  console.log("====================================");
  console.log(bucket.storage.authClient);
  console.log("====================================");
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
