var express = require("express");
var router = express.Router();
const fs = require("fs");
const multer = require("multer");
const { google } = require("googleapis");
var Oauth2Data = require("../credential.json");
const CLIENT_ID = Oauth2Data.web.client_id;
const CLIENT_SECRET = Oauth2Data.web.client_secret;
// const { REDIRECT_URI } = require("../config/config");
const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  (REDIRECT_URI =
    "https://peaceful-rex-368804.uc.r.appspot.com/google/callback")
);

var authed = false;

var upload = multer();
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

router.post("/upload", upload.single("file"), (req, res, next) => {
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
