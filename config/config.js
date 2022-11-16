const env = process.env;
let REDIRECT_URI =
  env.REDIRECT_URI ||
  "https://peaceful-rex-368804.uc.r.appspot.com/google/callback";
let ORIGIN_URI =
  env.ORIGIN_URI || "https://peaceful-rex-368804.uc.r.appspot.com";

module.exports = { REDIRECT_URI, ORIGIN_URI };
