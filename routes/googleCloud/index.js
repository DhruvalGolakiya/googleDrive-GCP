const express = require("express");
const router = express.Router();
const util = require("util");
const imageminJpegtran = require("imagemin-jpegtran");
const imageminPngquant = require("imagemin-pngquant");
const multer = require("../../config/multerConfig");
const multerFor = require("multer");
const path = require("path");
const serviceKey = path.join(__dirname, "../../keys.json");
const { google } = require("googleapis");
const { Storage } = require("@google-cloud/storage");
const Oauth2Data = require("../../credential.json");
const { file } = require("googleapis/build/src/apis/file");
const CLIENT_ID = Oauth2Data.web.client_id;
const CLIENT_SECRET = Oauth2Data.web.client_secret;
// const { REDIRECT_URI } = require("../../config/config");
const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  (REDIRECT_URI = "http://localhost:3000/google/googleCloud/callback")
);
// INIT STORAGE
const storage = new Storage({
  keyFilename: serviceKey, //
  projectId: process.env.PROJECT_ID,
});

const SCOPES =
  "https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/userinfo.email";
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
    res.render("gcpUpload");
  }
});
// COMPRESS

// router.use("/uploads", express.static(path.join(__dirname + "../../uploads")));
const fileStorage = multerFor.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});
const upload = multerFor({
  storage: fileStorage,
});
const imagemin = require("imagemin");
router.post("/compress/uploads/:name/:ext", async (req, res) => {
  const files = await imagemin(["uploads/" + req.params.name], {
    destination: "images",
    plugins: [
      imageminJpegtran(),
      imageminPngquant({
        quality: [0.6, 0.8],
      }),
    ],
  });
  res.download(files[0].destinationPath);
});

// UPLOAD TO BUCKET  PAGE
router.get("/uploadToBucket", (req, res) => {
  res.render("gcpUpload");
});
router.get("/callback", (req, res) => {
  const code = req.query.code;
  console.log("code");
  console.log(code);
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
        console.log(token);
        res.redirect("/google/googleCloud");
      }
    });
  } else {
    res.send("INVALID");
  }
});

router.get("/getFiles", (req, res) => {
  async function listFiles() {
    const [files] = await storage
      .bucket("peaceful-rex-368804.appspot.com")
      .getFiles();

    console.log("Files:");
    files.forEach((file) => {
      console.log(file);
      // console.log(file.name);`
    });
  }
  listFiles().catch(console.error);
});
// UPLOAD FILE TO BUCKET
router.post("/uploadToBucket", multer.single("file"), (req, res, next) => {
  if (!req.file) {
    res.status(400).send("No file uploaded.");
    return;
  }

  console.log("FILE___");
  console.log(req.file);
  const blob = bucket.file(req.file.originalname);

  const blobStream = blob.createWriteStream();
  blobStream.on("error", (err) => {
    next(err);
  });
  // console.log("====================================");
  // console.log(bucket.storage.authClient);
  // console.log("====================================");
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

router.get("/compressUpload", (req, res) => {
  res.render("compresUpload");
});
router.post("/uploadLocal", upload.single("image"), (req, res, next) => {
  const file = req.file;
  console.log(req.file);
  var ext;

  if (!file) {
    const error = new Error("Please Upload a file");
    error.httpStatusCode = 404;
    return next(error);
  }
  if (file.mimetype == "image/jpeg") {
    ext = "jpg";
  }
  if (file.mimetype == "image/png") {
    ext = "png";
  }
  console.log(file.path);

  res.render("image", { url: file.path, name: file.filename, ext: ext });
});

// LOGOUT
router.get("/logout", (req, res) => {
  authed = false;
  res.redirect("/google/googleCloud");
});

module.exports = router;
