const express = require("express");
const router = express.Router();
const Courses = require("../models/CourseModel");
const Orders = require("../models/OrderModel");
const Users = require("../models/UserModel");


const authMiddleware = require("../authMiddleware");
const Authentication = require("../auth/Authentication");

const test_api = require('../test_api');


// API ORDER:  /api/order

// POST enroll: call when user enroll any courses
// get my orders: GET /my-orders
// PUT orderID (approve transaction )
// get all orders for admin: GET /all-orders
// admin process order: POST /approve/:orderId

// enroll a course
router.post("/enroll", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { courseId, amount, paymentMethod, paymentProof, note } = req.body;
        // Check if the course exists
        const course = await Courses.findOne({ courseId: courseId });
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Create a new order
        const newOrder = new Orders({
            userId,
            courseId,
            amount,
            paymentMethod,
            paymentProof,
            note,
        });

        await newOrder.save();
        res.status(201).json({ message: "Order created successfully", order: newOrder });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// get my orders
router.get("/my-orders", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const orders = await Orders.find({ userId }).sort({ createdAt: -1 });

        // populate thủ công
        const enhancedOrders = await Promise.all(
            orders.map(async (order) => {
                const course = await Courses.findOne({ courseId: order.courseId });

                return {
                    ...order.toObject(),
                    courseId: {
                        name: course?.name,
                        price: course?.price,
                        banner: course?.banner
                    }
                };
            })
        );

        res.status(200).json(enhancedOrders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

router.put('/update/:orderId', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id;
        const { orderId } = req.params;
        const { note } = req.body;

        const order = await Orders.findOne({ _id: orderId, userId });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        if (order.status !== 'rejected') {
            return res.status(400).json({ message: 'Only rejected orders can be updated' });
        }

        order.status = 'pending';
        order.note = note || order.note;
        order.approveAt = undefined;
        order.noteFromAdmin = undefined;

        await order.save();

        return res.status(200).json({ message: 'Order updated and resubmitted for approval', order });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ message: 'Server error while updating order' });
    }
});

// get all orders for admin
router.get("/all-orders", authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const auth = new Authentication(user);
        if (!auth.isAdmin()) {
            return res.status(403).json({ message: "Forbidden" });
        }
        const orders = await Orders.find().populate("userId", "username email").sort({ createdAt: -1 });

        const enhancedOrders = await Promise.all(
            orders.map(async (order) => {
                const course = await Courses.findOne({ courseId: order.courseId });

                return {
                    ...order.toObject(),
                    courseId: {
                        name: course?.name,
                    }
                };
            })
        );

        // const orders = await Orders.find().populate("userId", "username email").populate("courseId", "name").sort({ createdAt: -1 });
        res.status(200).json(enhancedOrders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// admin process order
router.post("/process/:orderId", authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const auth = new Authentication(user);
        if (!auth.isAdmin()) return res.status(403).json({ message: 'Forbidden' });

        const { orderId } = req.params;
        const { action, noteFromAdmin } = req.body;
        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action' });
        }

        // Update order status
        const update = {
            status: action === 'approve' ? 'approved' : 'rejected',
            noteFromAdmin,
            approvedAt: new Date()
        };
        const order = await Orders.findByIdAndUpdate(orderId, update, { new: true });
        if (!order) return res.status(404).json({ message: 'Order not found' });

        // If approved, add to user's ownedCourses and increment course enrollCount
        if (action === 'approve') {
            await Users.findByIdAndUpdate(order.userId, {
                $push: {
                    ownedCourses: {
                        courseId: order.courseId,
                        progress: 0,
                        lastWatchedVideo: null,
                        completedVideos: [],
                        enrolledAt: new Date()
                    }
                }
            });

            // Increment the enrollCount in the course
            await Courses.findByIdAndUpdate(order.courseId, {
                $inc: { enrollCount: 1 }
            });
        }

        // Populate for response
        await order.populate('userId', 'username email');
        await order.populate('courseId', 'name');

        res.status(200).json(order);
    } catch (err) {
        console.error('Error processing order:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;