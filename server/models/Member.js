const mongoose = require('mongoose');

const memberSchema = mongoose.Schema({
    fullName: {
        type: String,
        required: true,
    },
    photo: {
        type: String, // URL to stored image
        default: '',
    },
    address: {
        line1: { type: String, required: true },
        line2: { type: String },
        city: { type: String, required: true },
        district: { type: String, required: true },
        taluka: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
    },
    mobile: {
        type: String,
        required: true,
    },
    dateOfBirth: {
        type: Date,
    },
    bloodGroup: {
        type: String,
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
    },
}, {
    timestamps: true,
});

const Member = mongoose.model('Member', memberSchema);
module.exports = Member;
