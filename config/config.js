const env = process.env;
let REDIRECT_URI = "";
let ORIGIN_URI =
  env.ORIGIN_URI || "https://peaceful-rex-368804.uc.r.appspot.com";

if (ORIGIN_URI == env.ORIGIN_URI) {
  REDIRECT_URI = env.REDIRECT_URI;
} else {
  REDIRECT_URI = "https://peaceful-rex-368804.uc.r.appspot.com/google/googleDrive/callback";
}

module.exports = { REDIRECT_URI };
