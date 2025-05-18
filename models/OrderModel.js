const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'user', required: true },  
    courseId: { type: Schema.Types.ObjectId, ref: 'course', required: true }, 
    amount: { type: Number, required: true },
    paymentMethod: { type: String, 
        enum: ['bank_tranfer', 'momo', 'zalo_pay'], 
        required: true },
    paymentProof: String, // URL to the payment proof image
    note: String, // Note from the user
    noteFromAdmin: String, // Note from the admin
    status: { type: String, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'pending' },        
    createdAt: { type: Date, default: Date.now },
    approveAt: { type: Date },
});

module.exports = mongoose.model('Order', OrderSchema, 'Orders');
