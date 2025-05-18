const mongoose = require('mongoose');

module.exports = function (req, res, next) {
  req.user = {
    _id: new mongoose.Types.ObjectId('67fbe538016594447c641a1a'), 
  };
  next();
};