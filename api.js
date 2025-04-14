// const mongoose = require('mongoose');
// const express = require('express');
// const router = express.Router();
// require("dotenv").config();
// const UserModel = require('../models/UserModel');




// const bcrypt = require('bcrypt');   // encode password
// const saltRounds = 10;

// // ...

// router.post('/register', async (req, res) => {
//     try {
//         // Lấy dữ liệu từ body
//         const { username, password, description } = req.body;

//         // Kiểm tra xem username đã tồn tại hay chưa
//         const existingUser = await UserModel.findOne({ username });
//         if (existingUser) {
//             return res.status(400).json({
//                 status: "fail",
//                 message: "Username đã tồn tại"
//             });
//         }

//         // Mã hoá mật khẩu (nếu bạn cần bảo mật)
//         const hashedPassword = await bcrypt.hash(password, saltRounds);

//         // Tạo user mới
//         const newUser = new UserModel({
//             username: username,
//             password: hashedPassword, // Lưu password đã mã hoá
//             description: description,
//             ownedCourses: [],
//             createdCourses: [],
//             cart: [],
//         });

//         // Lưu user vào database
//         await newUser.save();

//         // Trả về phản hồi thành công
//         return res.status(201).json({
//             status: "success",
//             message: "Đăng ký thành công!",
//             data: {
//                 username: newUser.username,
//                 description: newUser.description
//                 // Không trả password ra response
//             }
//         });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({
//             status: "error",
//             message: "Đã có lỗi xảy ra khi đăng ký"
//         });
//     }
// });





// // api mẫu
// // router.route('/get').get(async (req, res) => {
// //     try {
// //         const courses = await CourseModel.find();
// //         console.log(courses);
// //         res.setHeader('Access-Control-Allow-Origin', '*'); // set access
// //         res.json({data: courses, status: "success"});
// //     } catch (error) {
// //         console.log(error);
// //     }
// // });

// // router.route('/get/:value/by/:searchBy').get(async (req, res) => {
// //     try {
// //         const searchBy = req.params.searchBy;
// //         const value = req.params.value;
// //         const students = await StudentModel.find({
// //             [searchBy]: { $regex: value, $options: "i" } // Tìm kiếm không phân biệt hoa thường
// //         });
// //         res.setHeader('Access-Control-Allow-Origin', '*'); // set access
// //         if (students.length === 0) {
// //             res.json({data: [], status: "NOT FOUND"});
// //         } else {
// //             res.json({data: students, status: "success"});
// //         }
// //     } catch (error) {
// //         console.log(error);
// //     }
// // })


// module.exports = router;