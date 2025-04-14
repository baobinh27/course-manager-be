const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CourseSchema = new Schema({
    courseId: {type: String},
    userId: {type: Schema.Types.ObjectId, ref: "User", required: true },  // store userId from token
    name: String,
    author: String,
    tags: Array,
    description: String,
    content: [{sectionTitle: String, sectionContent: [{videoId: String, title: String, duration: String}]}],
    ratings: Array,
    enrollCount: Number,
    price: Number,
    lastModified: Date,
    banner: String
});

module.exports = mongoose.model("course", CourseSchema, "Courses");