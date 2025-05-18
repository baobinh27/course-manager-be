const jwt = require('jsonwebtoken');
const User = require('./models/UserModel');


const ACCESS_SECRET  = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET;

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  if (!token) {
    return res.status(401).json({ message: 'Missing access token' });
  }

  // verify accessToken
  jwt.verify(token, ACCESS_SECRET, async (err, payload) => {
    if (!err) {
      // Token hợp lệ
      req.user = { id: payload.userId, role: payload.role };
      return next();
    }

    // 'TokenExpiredError'
    if (err.name === 'TokenExpiredError') {
      // refresh token
      const refreshToken = req.headers['x-refresh-token'] || req.body.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({ message: 'Missing refresh token' });
      }

      try {
        const refPayload = jwt.verify(refreshToken, REFRESH_SECRET);
        const user = await User.findById(refPayload.userId);
        if (!user || !user.refreshTokens.includes(refreshToken)) {
          return res.status(403).json({ message: 'Invalid refresh token' });
        }

        const newAccessToken = jwt.sign(
          { userId: user._id, role: user.role },
          ACCESS_SECRET,
          { expiresIn: '1h' }
        );
        res.setHeader('x-access-token', newAccessToken);

        req.user = user;
        return next();

      } catch (refreshErr) {
        return res.status(403).json({ message: 'Refresh token expired or invalid' });
      }
    }

    return res.status(403).json({ message: 'Invalid access token' });
  });
}

module.exports = authMiddleware;

// const authMiddleware = async (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;
    
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return res.status(401).json({ message: 'Unauthorized: Missing or invalid token' });
//     }

//     const token = authHeader.split(' ')[1];
//     const secret = process.env.JWT_SECRET;
//     if (!secret) throw new Error('JWT_SECRET is not defined in environment');

//     // Verify token
//     const decoded = jwt.verify(token, secret);

//     const user = await User.findById(decoded.userId).select('-password');
//     if (!user) {
//       return res.status(401).json({ message: 'Unauthorized: User not found' });
//     }

//     req.user = user;   // add user to request object
//     next();
//   } catch (err) {
//     console.error('AuthMiddleware error:', err);
//     return res.status(401).json({ message: 'Invalid or expired token' });
//   }
// };


