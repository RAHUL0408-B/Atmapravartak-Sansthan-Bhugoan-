const mongoose = require('mongoose');

const memberSchema = mongoose.Schema({
    full_name: { type: String, required: true },
    full_name_marathi: { type: String },
    photo: { type: String, default: '' },
    joining_date: { type: Date },
    address_line1: { type: String, required: true },
    address_line1_marathi: { type: String },
    address_line2: { type: String },
    address_line2_marathi: { type: String },
    city: { type: String, required: true },
    city_marathi: { type: String },
    district: { type: String, required: true },
    district_marathi: { type: String },
    taluka: { type: String, required: true },
    taluka_marathi: { type: String },
    state: { type: String, required: true, default: 'Maharashtra' },
    state_marathi: { type: String, default: 'महाराष्ट्र' },
    post_office: { type: String },
    post_office_marathi: { type: String },
    pincode: { type: String },
    mobile: { type: String },
    date_of_birth: { type: Date },
    blood_group: { type: String },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
    },
    is_deleted: { type: Boolean, default: false }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Member = mongoose.model('Member', memberSchema);
module.exports = Member;
