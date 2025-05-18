const express = require("express");
const router = express.Router();
const Courses = require("../models/CourseModel");


const authMiddleware = require("../authMiddleware");
const Authentication = require("../auth/Authentication");

const optionalAuthMiddleware = require("../optionalAuthMiddleware")

const User = require("../models/UserModel");
const Orders = require("../models/OrderModel");

const test_api = require('../test_api');


// API COURSE:  /api/course

// get all for searching: GET /search?query= (name)
// get by courseId: GET courseId/:courseId (courseId)  coursecreatorId hoặc isEnrolled mới có quyền
 
// get by author: (bỏ) Trong user có Array createdCourses chứa các 
// các courseId của người đó tạo, truy vấn bằng courseID

// Get list of all courses, sau đó người dùng muốn truy cập vào course --> GET courseId/:courseId
// User get all created courses by user: GET /myCreatedCourse (no params)
// User get all enrolled courses by user: GET /myEnrolledCourse (no params)
// Trả về danh sách khoá đã tạo/enroll của người dùng, không kiểm tra phân quyền vì quá nhiều courses trả về, 
// phía frontend chỗ này cần hiển thị các thông tin của khoá, sau đó khi người dùng click vào khoá thì gọi tới API Get courseId/:courseId

// User delete a created course: DELETE /delete/:courseId (courseId)
// User update a created course: PUT /update/:courseId (courseId)
   
// User enroll in a course: POST /enroll (courseId)  + gọi tới Order API

// search courses: phục vụ cho hàm tìm kiếm cho tất cả người dùng, kể cả không đăng nhập
router.get("/search", async (req, res) => {
    try {
        // const { query, sort, limit } = req.query;

        const { query, min, max, rating, sort, limit } = req.query;

        const regex = new RegExp(query?.trim() || "", 'i');

        const filter = {};

        if (regex) {
            filter.$or = [
                { name: { $regex: regex } },
                { tags: { $elemMatch: { $regex: regex } } },
            ];
        }

        if (min) {
            filter.price = { ...filter.price, $gte: parseFloat(min) };
        }

        if (max) {
            filter.price = { ...filter.price, $lte: parseFloat(max) };
        }

        if (rating) {
            filter.averageRating = { $gte: parseFloat(rating) };
        }

        let queryBuilder = Courses.find(filter);

        // Sorting logic
        if (sort === "price_asc") {
            queryBuilder = queryBuilder.sort({ price: 1 });
        } else if (sort === "price_desc") {
            queryBuilder = queryBuilder.sort({ price: -1 });
        } else if (sort === "enroll_desc") {
            queryBuilder = queryBuilder.sort({ enrollCount: -1 });
        } else if (sort === "created_asc") {
            queryBuilder = queryBuilder.sort({ lastModified: 1 });
        } else if (sort === "created_desc") {
            queryBuilder = queryBuilder.sort({ lastModified: -1 }); // Default sort
        }

        if (limit) {
            queryBuilder = queryBuilder.limit(parseInt(limit));
        }

        const courses = await queryBuilder.exec();

        return res.status(200).json(courses);
    } catch (error) {
        console.error("Error searching courses:", error);
        return res.status(500).json({ message: "Server error while searching courses." });
    }
});

// get by courseId
router.get("/courseId/:courseId", optionalAuthMiddleware, async (req, res) => {
    try {
        const { courseId } = req.params;
        const user = req.user;

        const course = await Courses.findOne({ courseId: courseId });
        if (!course) {
            return res.status(404).json({ message: "Course not found!" });
        }
        let isAuthorized = false;
        
        if (user) {
            const auth = new Authentication(user);
            isAuthorized = auth.isCourseCreator(course) || auth.isEnrolled(courseId);
        }

        const courseObject = course;

        if (!isAuthorized) {
            courseObject.content = courseObject.content.map(section => ({
                sectionTitle: section.sectionTitle,
                sectionContent: section.sectionContent.map(video => ({
                    title: video.title,
                    duration: video.duration
                }))
            }));
        }

        res.status(200).json(courseObject);
    }
    catch (error) {
        console.error("Error getting course:", error);
        res.status(500).json({ message: "Server error!" });
    }
});

// User get all created courses by user
router.get("/myCreatedCourse", authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id; 
        const user = await User.findById(userId).populate({ path: 'createdCourses', model: Courses.modelName }); 
        if (!user){
            return res.status(404).json({ message: "User not found!" });
        }
        return res.status(200).json(user.createdCourses || []);
    }
    catch (error) {
        console.error("Error getting created courses:", error);
        res.status(500).json({ message: "Server error!" });
    }
});

// User get all enrolled courses by user
router.get("/myEnrolledCourse", authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).populate({ path: 'ownedCourses.courseId', model: Courses.modelName });
    
        if (!user) {
          return res.status(404).json({ message: "User not found!" });
        }
    
        const enrolled = user.ownedCourses.map(item => ({
          course: item.courseId,
          progress: item.progress,
          lastWatchedVideo: item.lastWatchedVideo,
          completedVideos: item.completedVideos,
          enrolledAt: item.enrolledAt
        }));
    
        return res.status(200).json(enrolled);
    } catch (error) {
        console.error("Error getting enrolled courses:", error);
        return res.status(500).json({ message: "Server error while fetching enrolled courses." });
    }
});


// Delete a created course by user
router.delete("/delete/:courseId", authMiddleware, async (req, res) => {
    try {
        const { courseId } = req.params;
        const user = req.user;
        const auth = new Authentication(user);

        if (auth.isAdmin()) {
            const course = await Courses.findOneAndDelete({ courseId });
            if (!course) {
                return res.status(404).json({ message: "Course not found!" });
            }
            return res.status(200).json({ message: "Course deleted successfully!" });
        }

        const course = await Courses.findOne({ courseId });
        if (!course) {
            return res.status(404).json({ message: "Course not found!" });
        }
        
        if (!auth.isCourseCreator(course)) {
            return res.status(403).json({ message: "No permission!!" });
        }
        
        await Courses.findOneAndDelete({ courseId });
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

        // Kiểm tra quyền admin
        if (auth.isAdmin()) {
            const updatedCourse = await Courses.findOneAndUpdate(
                { courseId },
                req.body,
                { new: true }
            );
            if (!updatedCourse) {
                return res.status(404).json({ message: "Course not found!" });
            }
            return res.status(200).json({ message: "Course updated successfully!" });
        }

        // Nếu không phải admin, kiểm tra xem người dùng có phải là người tạo khóa học không
        const course = await Courses.findOne({ courseId });
        if (!course) {
            return res.status(404).json({ message: "Course not found!" });
        }

        if (!auth.isCourseCreator(course)) {
            return res.status(403).json({ message: "No permission!!" });
        }
        
        const updatedCourse = await Courses.findOneAndUpdate(
            { courseId },
            req.body,
            { new: true }
        );
        
        res.status(200).json({ message: "Course updated successfully!" });
    } catch (error) {
        console.error("Error updating course:", error);
        res.status(500).json({ message: "Server error!" });
    }
});



// User enroll in a course
router.post("/enroll", authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id;
        const { courseId, paymentMethod, amount, note } = req.body;
        const user = req.user;
        const auth = new Authentication(user);

        if (!auth.logined()) {
            return res.status(403).json({ message: "No permission!!" });
        }
        if (auth.isEnrolled(courseId)) {
            return res.status(400).json({ message: "You are already enrolled in this course!" });
        }
        const course = await Courses.findOne({ courseId });
        if (!course) {
            return res.status(404).json({ message: "Course not found!" });
        }
        const order = new Orders({
            userId,
            courseId,
            amount,
            paymentMethod,
            note
          });
          await order.save();
        // ownedCourses:
        
        res.status(201).json({ message: "Enrollment request created. Please wait for admin approval.", order });

    } catch (error) {
        console.error("Error enrolling in course:", error);
        res.status(500).json({ message: "Server error!" });
    }
});



module.exports = router;