var mongoose = require("mongoose");

var FileSchema = new mongoose.Schema({
    file_name:String,
    public_url:String,
    user_id:String
});


module.exports = mongoose.model("FileSchema", FileSchema);