const mongoose = require("mongoose");
const { Schema } = mongoose;

const ReviewSchema = new Schema({
  courseId: { type: Schema.Types.ObjectId, ref: "course", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "user", required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, maxlength: 1000 },
  createdAt: { type: Date, default: Date.now }
});

ReviewSchema.index({ courseId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("Review", ReviewSchema);