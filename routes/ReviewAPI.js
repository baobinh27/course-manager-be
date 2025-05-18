const express = require("express");
const router = express.Router();
// const reviewController = require("../controllers/reviewController");
const mongoose = require('mongoose');
const authMiddleware = require("../authMiddleware");
const Review = require("../models/ReviewModel");
const Course = require('../models/CourseModel');
const User = require('../models/UserModel');

const updateCourseReviewStats = async (courseId) => {
  const stats = await Review.aggregate([
    { $match: { courseId: new mongoose.Types.ObjectId(courseId) } },
    {
      $group: {
        _id: '$courseId',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await Course.findByIdAndUpdate(courseId, {
      averageRating: stats[0].averageRating,
      reviewCount: stats[0].reviewCount
    });
  } else {
    // Nếu không còn đánh giá nào
    await Course.findByIdAndUpdate(courseId, {
      averageRating: 0,
      reviewCount: 0
    });
  }
};

// add new review
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { courseId, rating, comment } = req.body;
    const userId = req.user.id;

    const review = await Review.findOneAndUpdate(
      { courseId, userId },
      { rating, comment, createdAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await updateCourseReviewStats(courseId);

    res.status(200).json(review);
  } catch (err) {
    console.error("Error adding review:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// get course reviews
router.get("/course/:courseId", async (req, res) => {
  try { 
    const { courseId } = req.params;
    const reviews = await Review.find({ courseId: courseId }).populate("userId", "username");
    res.status(200).json(reviews);
  } catch (err) {
    console.error("Error getting reviews:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// get an user's reviews
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const reviews = await Review.find({ userId }).populate("courseId", "name");
    res.status(200).json(reviews);
  } catch (err) {
    console.error("Error getting reviews:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// get average rating and number of ratings of a course
router.get("/stats/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;
    const result = await Review.aggregate([
      { $match: { courseId: new mongoose.Types.ObjectId(courseId) } },
      {
        $group: {
          _id: "$courseId",
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 }
        }
      }
    ]);
    res.status(200).json(result[0] || { avgRating: 0, totalReviews: 0 });
  } catch (err) {
    console.error("Error calculating rating stats:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;