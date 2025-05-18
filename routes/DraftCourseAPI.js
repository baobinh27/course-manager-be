const express = require("express");
const mongoose = require('mongoose');
const router = express.Router();

const test_api = require('../test_api');

const authMiddleware = require("../authMiddleware");
const Authentication = require("../auth/Authentication");

const DraftCourses = require("../models/DraftCourseModel");
const Courses = require("../models/CourseModel");
const User = require("../models/UserModel");

const YOUTUBE_API_KEY = process.env.YOUTUBE_DATA_API;

// API DRAFT COURSE:  /api/draftCourse

// create: POST /create (courseId, name, author, tags, description, content, price, banner)
// update: PUT /update/:courseId (name, author, tags, description, content, price, banner)
// delete: DELETE /delete/:courseId (courseId)
// get by courseId: GET /:courseId (courseId)
// get all: GET /all (no params)

// ADMIN API FOR DRAFT COURSE
// get all draft courses: GET /allDraftCourses (no params)
// approve: POST /approve/:courseId (courseId)
// reject: POST /reject/:courseId (courseId)

// User create a draft course
router.post('/create', authMiddleware, async (req, res) => {
    try {
      const { name, author, tags, description, content, price, banner } = req.body;
      const user = req.user;
      const auth = new Authentication(user);
  
      if (!auth.isLoggedIn()) {
        return res.status(403).json({ message: 'Forbidden: Not logged in' });
      }

      if (!name || !content || !price || !banner) {
        return res.status(400).json({ message: 'Required fields cannot be empty' });
      }

      const courseId = new mongoose.Types.ObjectId();

      // Optional: prevent duplicate draft for same user & course
      const exists = await DraftCourses.findOne({ name, userId: user.id });
      if (exists) {
        return res.status(409).json({ message: 'Draft already exists for this course' });
      }
  
      const draft = new DraftCourses({ courseId, userId: user.id, name, author, tags, description, content, price, banner });
      await draft.save();
  
      res.status(201).json({ message: 'Draft course created successfully', draft });
    } catch (error) {
      console.error('Error creating draft course:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

// User update a draft course
router.put('/update/:courseId', authMiddleware, async (req, res) => {
    try {
      const { courseId } = req.params;
      const user = req.user;
      const auth = new Authentication(user);
  
      const draft = await DraftCourses.findOne({ courseId, userId: user.id });
      if (!draft) {
        return res.status(404).json({ message: 'Draft course not found' });
      }
  
      if (!auth.isDraftCourseCreator(draft)) {
        return res.status(403).json({ message: 'Forbidden: No permission' });
      }
  
      const updates = (({ name, author, tags, description, content, price, banner }) =>
        ({ name, author, tags, description, content, price, banner }))(req.body);
  
      const updated = await DraftCourses.findOneAndUpdate(
        { courseId, userId: user.id },
        updates,
        { new: true }
      );
  
      res.status(200).json({ message: 'Draft course updated successfully', draft: updated });
    } catch (error) {
      console.error('Error updating draft course:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
// User delete a draft course
  router.delete('/delete/:courseId', authMiddleware, async (req, res) => {
    try {
      const { courseId } = req.params;
      const user = req.user;
      const auth = new Authentication(user);
  
      const draft = await DraftCourses.findOne({ courseId, userId: user.id });
      if (!draft) {
        return res.status(404).json({ message: 'Draft course not found' });
      }
  
      if (!auth.isDraftCourseCreator(draft)) {
        return res.status(403).json({ message: 'Forbidden: No permission' });
      }
  
      await DraftCourses.deleteOne({ courseId, userId: user.id });
      res.status(200).json({ message: 'Draft course deleted successfully' });
    } catch (error) {
      console.error('Error deleting draft course:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

// User get all user's draft courses       
router.get('/all', authMiddleware, async (req, res) => {
    try {
      const user = req.user;
      const drafts = await DraftCourses.find({ userId: user.id });
  
      res.status(200).json(drafts);
    } catch (error) {
      console.error('Error fetching draft courses:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

// get all draft courses for admin
router.get('/allDraftCourses', authMiddleware, async (req, res) => {
    try {
      const user = req.user;
      const auth = new Authentication(user);
  
      if (!auth.isAdmin()) {
        return res.status(403).json({ message: 'Forbidden: Admins only' });
      }
  
      const drafts = await DraftCourses.find({});
      res.status(200).json(drafts);
    } catch (error) {
      console.error('Error fetching all draft courses:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

function extractVideoId(url) {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^\s&]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

async function fetchVideoMetadata(videoId) {
  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    const item = data.items[0];

    if (!item) return null;

    const title = item.snippet.title;
    // const duration = parseYouTubeDuration(item.contentDetails.duration); // ISO 8601 → hh:mm:ss
    const duration = item.contentDetails.duration;

    return { videoId, title, duration };
  } catch (err) {
    console.error(`Error fetching metadata for videoId ${videoId}:`, err.message);
    return null;
  }
}

// admin approve a draft course
router.post('/approve/:courseId', authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;
    const user = req.user;
    const auth = new Authentication(user);

    if (!auth.isAdmin()) {
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }

    const draft = await DraftCourses.findOne({ courseId: courseId });
    if (!draft) {
      return res.status(404).json({ message: 'Draft course not found' });
    }

    const contentWithMetadata = [];

    for (const section of draft.content) {
      const sectionData = {
        sectionTitle: section.sectionTitle,
        sectionContent: []
      };

      for (const link of section.sectionContent) {
        const videoId = extractVideoId(link);
        if (!videoId) continue;

        const metadata = await fetchVideoMetadata(videoId);
        if (metadata) {
          sectionData.sectionContent.push(metadata);
        }
      }
      contentWithMetadata.push(sectionData);
    }    

    // Kết hợp cả hai phiên bản: bỏ courseId như nhánh main đề xuất
    // nhưng giữ lại cấu trúc xử lý content từ nhánh của bạn
    const course = new Courses({
      courseId: draft.courseId,
      userId: draft.userId,
      name: draft.name,
      author: draft.author,
      tags: draft.tags,
      description: draft.description,
      content: contentWithMetadata,
      ratings: [],
      enrollCount: 0,
      price: draft.price,
      lastModified: new Date(),
      banner: draft.banner,
    });
    await course.save();

    // Update in user.createdCourses
    const courseOwner = await User.findById(draft.userId);
    if (courseOwner) {
      courseOwner.createdCourses = courseOwner.createdCourses || [];
      courseOwner.createdCourses.push(course.courseId);
      await courseOwner.save();
    }
    await DraftCourses.deleteOne({ courseId });


    res.status(201).json({ message: 'Draft course approved successfully', course });
  } catch (error) {
    console.error('Error approving draft course:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// admin reject a draft course
router.post('/reject/:courseId', authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;
    const user = req.user;
    const auth = new Authentication(user);

    if (!auth.isAdmin()) {
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }

    const deleted = await DraftCourses.findOneAndDelete({ courseId });
    if (!deleted) {
      return res.status(404).json({ message: 'Draft course not found' });
    }

    res.status(200).json({ message: 'Draft course rejected and deleted' });
  } catch (error) {
    console.error('Error rejecting draft course:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// User get a draft course by courseId
router.get('/:courseId', authMiddleware, async (req, res) => {
    try {
      const { courseId } = req.params;
      const user = req.user;
      const auth = new Authentication(user);
      
      let draft;
      
      // Nếu là admin, cho phép xem bất kỳ draftCourse nào
      if (auth.isAdmin()) {
        draft = await DraftCourses.findOne({ courseId });
      } else {
        // Người dùng thường chỉ có thể xem draftCourse của họ
        draft = await DraftCourses.findOne({ courseId, userId: user.id });
      }
      
      if (!draft) {
        return res.status(404).json({ message: 'Draft course not found' });
      }
  
      res.status(200).json(draft);
    } catch (error) {
      console.error('Error fetching draft course:', error);
      res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;