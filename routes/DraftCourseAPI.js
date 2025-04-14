const express = require("express");
const DraftCourses = require("../models/DraftCourseModel");
const Courses = require("../models/CourseModel");
const router = express.Router();
const authMiddleware = require("../authMiddleware");
const User = require("../models/UserModel");


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
router.post("/create", authMiddleware, async (req, res) => {
    try {
        const { courseId, name, author, tags, description, content, price, banner } = req.body;
        const user = req.user;
        const userId = user._id;
        const auth = new Authentication(user);
        if (!auth.logined()) {
            return res.status(403).json({ message: "No permission!!" });
        }
        const newDraftCourse = new DraftCourses({ courseId, userId, name, author, tags, description, content, price, banner });
        await newDraftCourse.save();
        res.status(201).json({ message: "Draft course created successfully!" });
    }
    catch (error) {
         console.error("Error creating draft course:", error);
         res.status(500).json({ message: "Server error!" });
    }
});

// User update a draft course
router.put("/update/:courseId", authMiddleware, async (req, res) => {
    try {
        const { courseId } = req.params;
        const course = await DraftCourses.findOne({ courseId });
        const { name, author, tags, description, content, price, banner } = req.body;
        const user = req.user;
        const userId = user._id;
        const auth = new Authentication(user);

        if (!auth.isDraftCourseCreator(course)) {
            return res.status(403).json({ message: "No permission!!" });
        }

        const updatedDraftCourse = await DraftCourses.findOneAndUpdate(
            { courseId, userId },
            { name, author, tags, description, content, price, banner },
            { new: true }
        );
        

        if (!updatedDraftCourse) {
            return res.status(404).json({ message: "Draft course not found!" });
        }
        res.status(200).json({ message: "Draft course updated successfully!" });
    }
    catch (error) {
         console.error("Error updating draft course:", error);
         res.status(500).json({ message: "Server error!" });
    }
});

// User delete a draft course
router.delete("/delete/:courseId", authMiddleware, async (req, res) => {
    try {
        const { courseId } = req.params;
        const course = await DraftCourses.findOne({ courseId });
        const user = req.user;
        const userId = user._id;
        const auth = new Authentication(user);

        if (!auth.isDraftCourseCreator(course)) {
            return res.status(403).json({ message: "No permission!!" });
        }
        const deletedDraftCourse = await DraftCourses.findOneAndDelete({ courseId, userId });
        if (!deletedDraftCourse) {
            return res.status(404).json({ message: "Draft course not found!" });
        }
        res.status(200).json({ message: "Draft course deleted successfully!" });
    }
    catch (error) {
         console.error("Error deleting draft course:", error);
         res.status(500).json({ message: "Server error!" });
    }
});

// User get a draft course by courseId
router.get("/:courseId", authMiddleware, async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user._id;
        const draftCourse = await DraftCourses.findOne({ courseId, userId });
        if (!draftCourse) {
            return res.status(404).json({ message: "Draft course not found!" });
        }
        res.status(200).json(draftCourse);
    }
    catch (error) {
         console.error("Error fetching draft course:", error);
         res.status(500).json({ message: "Server error!" });
    }
});

// User get all user's draft courses       
router.get("/all", authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id;
        const draftCourses = await DraftCourses.find({ userId });
        if (!draftCourses || draftCourses.length === 0) {
            return res.status(404).json({ message: "No draft courses found!" });
        }
        res.status(200).json(draftCourses);
    }
    catch (error) {
        console.error("Error fetching draft courses:", error);
        res.status(500).json({ message: "Server error!" });
    }
});

// get all draft courses for admin
router.get("/allDraftCourses", async (req, res) => {
    try {
        const draftCourses = await DraftCourses.find({});
        if (!draftCourses || draftCourses.length === 0) {
            return res.status(404).json({ message: "No draft courses found!" });
        }
        res.status(200).json(draftCourses);
    }
    catch (error) {
         console.error("Error fetching draft courses:", error);
         res.status(500).json({ message: "Server error!" });
    }
});

// admin approve a draft course
router.post("/approve/:courseId", async (req, res) => {
    try {
        const { courseId } = req.params;
        const draftCourse = await DraftCourses.findOne({ courseId });
        if (!draftCourse) {
            return res.status(404).json({ message: "Draft course not found!" });
        }

        const newCourse = new Courses({      
        courseId: draftCourse.courseId,
        userId: draftCourse.userId,
        name: draftCourse.name,
        author: draftCourse.author,
        tags: draftCourse.tags,
        description: draftCourse.description,
        content: draftCourse.content,
        ratings: [],
        enrollCount: 0,
        price: draftCourse.price,
        lastModified: new Date(),
        banner: draftCourse.banner
        });
        await newCourse.save();

        await DraftCourses.deleteOne({ courseId });        
        // Update the courseId in created Courses by user
        const user = await User.findById(draftCourse.userId);
        if (user) {
            user.createdCourses.push(newCourse._id);
            await user.save();
        } else {
            console.error("User not found:", draftCourse.userId);
        }
        res.status(201).json({ message: "Draft course approved and moved to Courses!" });

    }
    catch (error) {
         console.error("Error approving draft course:", error);
         res.status(500).json({ message: "Server error!" });
    }
});

// admin reject a draft course
router.post("/reject/:courseId", async (req, res) => {
    try {
         const { courseId } = req.params;
         const deletedDraftCourse = await DraftCourses.findOneAndDelete({ courseId });
         if (!deletedDraftCourse) {
             return res.status(404).json({ message: "Draft course not found!" });
         }
         res.status(200).json({ message: "Draft course rejected!" });
    }
    catch (error) {
         console.error("Error rejecting draft course:", error);
         res.status(500).json({ message: "Server error!" });
    }
});

module.exports = router;