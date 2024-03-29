const express = require("express");
const router = express.Router();
const util = require("util");
const multer = require("../../config/multerConfig");
const multerFor = require("multer");
const path = require("path");
const imageminJpegtran = require("imagemin-jpegtran");
const imageminPngquant = require("imagemin-pngquant");
const mongoose = require("mongoose");
const serviceKey = path.join(__dirname, "../../keys.json");
const { google } = require("googleapis");
const { Storage } = require("@google-cloud/storage");
const Oauth2Data = require("../../credential.json");
const CLIENT_ID = Oauth2Data.web.client_id;
const CLIENT_SECRET = Oauth2Data.web.client_secret;
const fileSchema = require("../../model/fileModel");
const { buffer } = require("imagemin");
const fs = require("fs");
const Https = require("https");
mongoose.connect(
  "mongodb+srv://Dhruval:DhruvalMDDK257@cluster0.eus4ytk.mongodb.net/imageData"
);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
  console.log("Connected successfully");
});

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
// INIT BUCKET
const bucket = storage.bucket("peaceful-rex-368804.appspot.com"); // bucket name

router.get("/", async (req, res, next) => {
  if (!req.session.user_id) {
    var url = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });
    console.log("url");
    console.log(url);
    res.render("GCloud", { url: url });
  } else {
    const images = await db
      .collection("fileschemas")
      .find({ user_id: req.session.user_id })
      .toArray();
    console.log(images);
    res.locals.imageList = images;
    res.render("gcpUpload");
  }
});
// COMPRESS

// router.use("/uploads", express.static());
// const fileStorage = multerFor.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads");
//   },
//   filename: function (req, file, cb) {
//     cb(
//       null,
//       file.fieldname + "-" + Date.now() + path.extname(file.originalname)
//     );
//   },
// });
// const upload = multerFor({
//   storage: fileStorage,
// });
// const imagemin = require("imagemin");
// router.post("/compress/uploads/:name/:ext", async (req, res) => {
//   const files = await imagemin(["uploads/" + req.params.name], {
//     destination: "images",
//     plugins: [
//       imageminJpegtran(),
//       imageminPngquant({
//         quality: [0.6, 0.8],
//       }),
//     ],
//   });

// });

// UPLOAD TO BUCKET  PAGE
router.get("/uploadToBucket", (req, res) => {
  res.render("gcpUpload");
});
router.get("/callback", (req, res) => {
  uploaded = false;
  const code = req.query.code;
  console.log("code");
  console.log(code);
  if (code) {
    oAuth2Client.getToken(code, async (err, token) => {
      if (err) {
        console.log("Error");
        console.log(err);
      } else {
        console.log("Success");
        const ticket = await oAuth2Client.verifyIdToken({
          idToken: token.id_token,
          audience: CLIENT_ID,
        });
        const payload = ticket.getPayload();
        console.log(req.session);
        req.session.user_id = payload.sub;
        req.session.email = payload.email;
        req.session.save(() => {
          console.log("session");
          console.log(req.session);
          oAuth2Client.setCredentials(token);
          res.redirect("/google/googleCloud");
        });
      }
    });
  } else {
    res.send("INVALID");
  }
});

// UPLOAD FILE TO BUCKET
router.post(
  "/uploadToBucket",
  multer.single("file"),
  async (req, res, next) => {
    if (!req.file) {
      res.status(400).send("No file uploaded.");
      return;
    }
    console.log(req.session);
    const blob = bucket.file(
      req.session.user_id +
        "/" +
        new Date().getTime() +
        "_" +
        req.file.originalname
    );

    const blobStream = blob.createWriteStream({ public: true });
    blobStream.on("error", (err) => {
      next(err);
    });

    const public_urL = `https://storage.googleapis.com/peaceful-rex-368804.appspot.com/${blob.id}`;
    console.log(public_urL);
    console.log(blob.id);
    blobStream.on("finish", async (cb) => {
      const newFile = new fileSchema({
        user_id: req.session.user_id,
        file_name:
          req.session.user_id +
          "/" +
          new Date().getTime() +
          "_" +
          req.file.originalname,
        public_url: public_urL,
      });
      newFile.save().then(async () => {
        res.redirect("/google/googleCloud");
      });
    });
    // console.log(req.file.buffer.toString());

    // console.log(result);
    // const filePath = path.join(__dirname + `../../${req.file.originalname}`);
    // fs.writeFile(filePath, result, () => {});
    blobStream.end(req.file.buffer);
  }
);

// router.get('/download/',(req,res)=>{
// })
// async function downloadFile(url, targetFile) {
//   return await new Promise((resolve, reject) => {
//     Https.get(url, (response) => {
//       const code = response.statusCode ?? 0;
//       console.log(code);
//       if (code >= 400) {
//         return reject(new Error(response.statusMessage));
//       }

//       // handle redirects
//       if (code > 300 && code < 400 && !!response.headers.location) {
//         return downloadFile(response.headers.location, targetFile);
//       }
//       console.log(response.headers.location);

//       console.log(targetFile);
//       // save the file to disk
//       const fileWriter = fs
//         .createWriteStream(targetFile, {})
//         .on("finish", () => {
//           resolve({});
//         });

//       response.pipe(fileWriter);
//     }).on("error", (error) => {
//       reject(error);
//     });
//   });
// }

const download = require("image-downloader");
router.post("/download/:id", async (req, res) => {
  // const result = await buffer('/Volumes/HDD/Dhruval/Projects/googleDrive/routes/123.png', {
  //   plugins: [
  //     imageminJpegtran(),
  //     imageminPngquant({
  //       quality: [0.6, 0.8],
  //     }),
  //   ],
  // });

  const files = fs.createReadStream("https://storage.googleapis.com/peaceful-rex-368804.appspot.com/117559250260681025148/1669111933881_Minimal-MacBook-Wallpaper-4k.jpeg");
  res.writeHead(200, {
    "Content-disposition": "attachment; filename:uploads.png",
  });

  files.pipe(res)

  // await download.image({
  //   dest: "../../Sample-png-image-500kb.png",
  //   url: "https://storage.googleapis.com/peaceful-rex-368804.appspot.com/116072143935947297851%2F1669121068060_Sample-png-image-500kb.png",
  // });
  // const image_id = req.params.id;
  // console.log(image_id);
  // const fileRef = bucket.file(
  //   "116072143935947297851/1669119207985_wp10117157-macos-dark-wallpapers.jpg"
  // );

  // req.params.name = "1669119207985_wp10117157-macos-dark-wallpapers.jpg";
  // const images = await db
  //   .collection("fileschemas")
  //   .find({ user_id: req.session.user_id })
  //   .toArray();
  // console.log(images);
  // images.forEach((image) => {
  //   console.log(image.file_name);
  //   req.params.id = image.file_name;
  // });

  // await res.download("./Sample-png-image-500kb.png");
  // const filePath = path.join(__dirname + `../../../Sample-png-image-500kb.png`);
  // await fs.unlinkSync(filePath)
  // await res.redirect('/google/googleCloud')
});

// router.get("/compressUpload", (req, res) => {
//   res.render("compresUpload");
// });

// router.post("/uploadLocal", upload.single("image"), (req, res, next) => {
//   const file = req.file;
//   console.log(req.file);
//   var ext;

//   if (!file) {
//     const error = new Error("Please Upload a file");
//     error.httpStatusCode = 404;
//     return next(error);
//   }
//   if (file.mimetype == "image/jpeg") {
//     ext = "jpg";
//   }
//   if (file.mimetype == "image/png") {
//     ext = "png";
//   }
//   console.log(file.path);

//   res.render("image", { url: file.path, name: file.filename, ext: ext });
// });

// LOGOUT
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/google/googleCloud");
  });
});

module.exports = router;
