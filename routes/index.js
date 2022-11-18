var express = require("express");
var router = express.Router();
const fs = require("fs");
const Multer = require("multer");
const { google } = require("googleapis");
var Oauth2Data = require("../credential.json");
const CLIENT_ID = Oauth2Data.web.client_id;
const CLIENT_SECRET = Oauth2Data.web.client_secret;
const { _REDIRECT_URI } = require("../config/config");
const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  _REDIRECT_URI
);

const util = require("util");

const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // no larger than 5mb, you can change as needed.
  },
});
const { Storage } = require("@google-cloud/storage");
const path = require("path");
const serviceKey = path.join(__dirname, "../keys.json");
const storage = new Storage({
  keyFilename: serviceKey,
  projectId: "peaceful-rex-368804",
});

const bucket = storage.bucket("peaceful-rex-368804.appspot.com");
var authed = false;

const SCOPES = "https://www.googleapis.com/auth/drive";

router.get("/", function (req, res, next) {
  if (!authed) {
    var url = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });
    console.log("url");
    console.log(url);
    res.render("index", { url: url });
  } else {
    res.render("success", { success: false });
  }
});

router.get("/callback", (req, res) => {
  const code = req.query.code;
  console.log("code");
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
        res.redirect("/google");
      }
    });
  } else {
    res.send("INVALID");
  }
});


router.get('/uploadToBucket',(req,res)=>{
  res.render('gcpUpload')
})
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

router.post("/upload", multer.single("file"), (req, res, next) => {
  let stream = require("stream");
  let fileObject = req.file;
  let bufferStream = new stream.PassThrough();
  bufferStream.end(fileObject.buffer);
  google
    .drive({ version: "v3", auth: oAuth2Client })
    .files.create({
      media: {
        mimeType: req.file.mimetype,
        body: bufferStream,
      },
      requestBody: {
        name: req.file.originalname,
        mimeType: req.file.mimetype,
      },
      fields: "id",
    })
    .then(function (resp) {
      console.log(resp, "resp");
    })
    .catch(function (error) {
      console.log(error);
    });
  res.send(`File uploaded`);
});

router.get("/logout", (req, res) => {
  (authed = false), res.redirect("/google");
});

module.exports = router;
