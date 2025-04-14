const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Đây sẽ là đối tượng được gửi đến admin khi người dùng tạo khoá học
const DraftCourseSchema = new Schema({
    name: String,
    author: String,
    tags: Array,
    description: String,
    content: [{sectionTitle: String, sectionContent: [{videoId: String, title: String, duration: String}]}],
    price: Number,
    banner: String
});

module.exports = mongoose.model("course", DraftCourseSchema, "Courses");