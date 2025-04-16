const express = require("express");
const router = express.Router();
const Courses = require("../models/CourseModel");
const authMiddleware = require("../authMiddleware");
const User = require("../models/UserModel");
const Authentication = require("../auth/Authentication")


// API COURSE:  /api/course
// get by courseId: GET /:courseId (courseId)
// get all: GET /all (no params)
// get by tag: GET /tag/:tag (tag)
// get by name: GET /name/:name (name)
// get by author: GET /author/:author (author)

// User get all created courses by user: GET /myCreatedCourse (no params)
// User get all enrolled courses by user: GET /myEnrolledCourse (no params)
// User enroll in a course: POST /enroll (courseId)
// User view a enrolled course: GET /view/:courseId (courseId)

// User delete a created course: DELETE /delete/:courseId (courseId)
// User update a created course: PUT /update/:courseId (courseId)


// get all courses
router.get("/", async (req, res) => {
    try {
        const courses = await Courses.find({});
        if (!courses || courses.length === 0) {
            return res.status(404).json({ message: "No courses found!" });
        }
        res.status(200).json(courses);
}
    catch (error) {
            console.error("Error getting courses:", error);
            res.status(500).json({ message: "Server error!" });
        }
});

// User get all created courses by user
router.get("/myCreatedCourse", authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const auth = new Authentication(user);
        if (!auth.logined()) {
            return res.status(403).json({ message: "No permission!!" });
        }
        if (user){
            return res.status(200).json(user.createdCourses);
        }
        else {
            return res.status(404).json({ message: "User not found!" });
        }
    }
    catch (error) {
        console.error("Error getting created courses:", error);
        res.status(500).json({ message: "Server error!" });
    }
});

// User get all enrolled courses by user
router.get("/myEnrolledCourse", authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const auth = new Authentication(user);

        if (!auth.logined()) {
            return res.status(403).json({ message: "No permission!!" });
        }
        if (user){
            return res.status(200).json(user.ownedCourses);
        }
        else {
            return res.status(404).json({ message: "User not found!" });
        }
    }
    catch (error) {
        console.error("Error getting enrolled courses:", error);
        res.status(500).json({ message: "Server error!" });
    }
});

// get courses by tags
router.get("/tags/:tag", async (req, res) => {
    try {
         const { tag } = req.params;
         const courses = await Courses.find({ tag });
         if (!courses || courses.length === 0) {
             return res.status(404).json({ message: "No courses found!" });
         }
         res.status(200).json(courses);
    }
    catch (error) {
         console.error("Error getting courses:", error);
         res.status(500).json({ message: "Server error!" });
    }
});

// get courses by name
router.get("/name/:name", async (req, res) => {
    try {
         const { name } = req.params;
         const courses = await Courses.find({ name });
         if (!courses || courses.length === 0) {
             return res.status(404).json({ message: "No courses found!" });
         }
         res.status(200).json(courses);
    }
    catch (error) {
         console.error("Error getting courses:", error);
         res.status(500).json({ message: "Server error!" });
    }
});

// get courses by author
router.get("/author/:author", async (req, res) => {
    try {
         const { author } = req.params;
         const courses = await Courses.find({ author });
         if (!courses || courses.length === 0) {
             return res.status(404).json({ message: "No courses found!" });
         }
         res.status(200).json(courses);
    }
    catch (error) {
         console.error("Error getting courses:", error);
         res.status(500).json({ message: "Server error!" });
    }
});

// User enroll in a course
router.post("/enroll", authMiddleware, async (req, res) => {
    try {
        const { courseId } = req.body;
        const course = await Courses.findOne({ courseId });
        const user = req.user;
        const auth = new Authentication(user);

        if (!auth.logined()) {
            return res.status(403).json({ message: "No permission!!" });
        }
        if (auth.isEnrolled(courseId)) {
            return res.status(400).json({ message: "You are already enrolled in this course!" });
        }
        if (!user) {
            return res.status(404).json({ message: "User not found!" });
        }
        // ownedCourses: [
        //     {
        //       courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
        //       progress: Number, // số video đã hoàn thành
        //       lastWatchedVideo: String, // videoId cuối cùng xem
        //       completedVideos: [String], // danh sách videoId đã hoàn thành
        //       enrolledAt: { type: Date, default: Date.now }
        //     }
        //   ],
        user.ownedCourses.push({
            courseId: courseId,
            progress: 0,
            lastWatchedVideo: null,
            completedVideos: [],
            enrolledAt: new Date()
        });
        course.enrollCount += 1;
        await course.save();
        await user.save();
        res.status(200).json({ message: "Enrolled successfully!" });
    } catch (error) {
        console.error("Error enrolling in course:", error);
        res.status(500).json({ message: "Server error!" });
    }
});

// User view a enrolled course
router.get("/view/:courseId", authMiddleware, async (req, res) => {
    try {
        const { courseId } = req.params;
        const user = req.user;
        const auth = new Authentication(user);

        if (!auth.isEnrolled(courseId)) {
            return res.status(403).json({ message: "No permission!!" });
        }
        if (!user) {
            return res.status(404).json({ message: "User not found!" });
        }
        const course = await Courses.findOne({ courseId });
        if (!course) {
            return res.status(404).json({ message: "Course not found!" });
        }
        res.status(200).json(course);
    } catch (error) {
        console.error("Error viewing course:", error);
        res.status(500).json({ message: "Server error!" });
    }
});

// Delete a created course by user
router.delete("/delete/:courseId", authMiddleware, async (req, res) => {
    try {
        const { courseId } = req.params;
        const user = req.user;
        const auth = new Authentication(user);

        if (!auth.isCourseCreator(courseId)) {
            return res.status(403).json({ message: "No permission!!" });
        }
        const course = await Courses.findOneAndDelete({ courseId });
        if (!course) {
            return res.status(404).json({ message: "Course not found!" });
        }
        res.status(200).json({ message: "Course deleted successfully!" });
    } catch (error) {
        console.error("Error deleting course:", error);
        res.status(500).json({ message: "Server error!" });
    }
});

// Update a created course by user
router.put("/update/:courseId", authMiddleware, async (req, res) => {
    try {
        const { courseId } = req.params;
        const user = req.user;
        const auth = new Authentication(user);

        if (!auth.isCourseCreator(courseId)) {
            return res.status(403).json({ message: "No permission!!" });
        }
        const updatedCourse = await Courses.findOneAndUpdate(
            { courseId },
            req.body,
            { new: true }
        );
        if (!updatedCourse) {
            return res.status(404).json({ message: "Course not found!" });
        }
        res.status(200).json({ message: "Course updated successfully!" });
    } catch (error) {
        console.error("Error updating course:", error);
        res.status(500).json({ message: "Server error!" });
    }
});

// get course by courseId
router.get("/:courseId", async (req, res) => {
    try {
         const { courseId } = req.params;
         const course = await Courses.findOne({ _id: courseId });
         if (!course) {
             return res.status(404).json({ message: "Course not found!" });
         }
         res.status(200).json(course);
    }
    catch (error) {
         console.error("Error getting course:", error);
         res.status(500).json({ message: "Server error!" });
    }
});

module.exports = router;