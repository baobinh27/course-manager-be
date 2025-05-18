const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const ownedCourses = new Schema({
    courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
    progress: Number, // số video đã hoàn thành
    lastWatchedVideo: String, // videoId cuối cùng xem
    completedVideos: [String], // danh sách videoId đã hoàn thành
    enrolledAt: { type: Date, default: Date.now }
});

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },  //required password
  email: { type: String, required: true },
  description: String,
  role: { type: String, enum: ['user', 'banned', 'admin'], default: 'user' },
  ownedCourses: [ownedCourses], 
  createdCourses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
  cart: Array,
  refreshTokens: [{ type: String }],
});

module.exports = mongoose.model("user", UserSchema, "Users");