const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// const api = require('./api');

dotenv.config();

connectDB();

const app = express();
app.use(express.json()); 
app.use(cors());

// Routes
app.use("/api/user", require("./routes/UserAPI"));
app.use("/api/draftCourse", require("./routes/DraftCourseAPI"));
app.use("/api/course", require("./routes/CourseAPI"));



const PORT = process.env.PORT_BE || 5000;
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));
