const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },  //required password
  email: { type: String, required: true },
  description: String,
  ownedCourses: [
      {
        courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
        progress: Number, // số video đã hoàn thành
        lastWatchedVideo: String, // videoId cuối cùng xem
        completedVideos: [String], // danh sách videoId đã hoàn thành
        enrolledAt: { type: Date, default: Date.now }
      }
    ],
  createdCourses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
  cart: Array,
});

module.exports = mongoose.model("user", UserSchema, "Users");