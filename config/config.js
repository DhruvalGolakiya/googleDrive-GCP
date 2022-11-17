const env = process.env;
let _REDIRECT_URI = "";
let ORIGIN_URI =
  env.ORIGIN_URI || "https://peaceful-rex-368804.uc.r.appspot.com";

if (ORIGIN_URI == env.ORIGIN_URI) {
  _REDIRECT_URI = env.REDIRECT_URI;
} else {
  _REDIRECT_URI =
    "https://peaceful-rex-368804.uc.r.appspot.com/google/callback";
}

 module.exports = { _REDIRECT_URI };
