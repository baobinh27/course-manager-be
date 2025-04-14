const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DraftCourseSchema = new Schema({
     courseId: {type: String},
     userId: {type: Schema.Types.ObjectId, ref: "User", required: true },  // store userId from token
     name: String,
     author: String,
     tags: Array,
     description: String,
     content: Array(Array({videoId: String, title: String, duration: String})),
     price: Number,
     banner: String
})

module.exports = mongoose.model("draftcourse", DraftCourseSchema, "DraftCourses");