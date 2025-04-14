const jwt = require("jsonwebtoken");
const User = require("./models/UserModel");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, "SECRET_KEY");
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    req.user = user; // Gán toàn bộ thông tin người dùng vào req.user
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = authMiddleware;


// const jwt = require("jsonwebtoken");

// Sau khi xác thực thành công:
// const token = jwt.sign({ userId: user._id }, "SECRET_KEY", { expiresIn: "1d" });
// res.json({ token });
