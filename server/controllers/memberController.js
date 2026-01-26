const Member = require('../models/Member');

// @desc    Get all members
// @route   GET /api/members
// @access  Private
const getMembers = async (req, res) => {
    try {
        const members = await Member.find({}).sort({ createdAt: -1 });
        res.json(members);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get member by ID
// @route   GET /api/members/:id
// @access  Private
const getMemberById = async (req, res) => {
    try {
        const member = await Member.findById(req.params.id);
        if (member) {
            res.json(member);
        } else {
            res.status(404).json({ message: 'Member not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a member
// @route   POST /api/members
// @access  Private
const createMember = async (req, res) => {
    const {
        fullName,
        address,
        mobile,
        dateOfBirth,
        bloodGroup,
        // Add other fields from body
    } = req.body;

    try {
        const member = new Member({
            fullName,
            address,
            mobile,
            dateOfBirth,
            bloodGroup,
        });

        const createdMember = await member.save();
        res.status(201).json(createdMember);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a member
// @route   PUT /api/members/:id
// @access  Private
const updateMember = async (req, res) => {
    try {
        const member = await Member.findById(req.params.id);

        if (member) {
            member.fullName = req.body.fullName || member.fullName;
            member.address = req.body.address || member.address;
            member.mobile = req.body.mobile || member.mobile;
            member.dateOfBirth = req.body.dateOfBirth || member.dateOfBirth;
            member.bloodGroup = req.body.bloodGroup || member.bloodGroup;
            member.status = req.body.status || member.status;

            const updatedMember = await member.save();
            res.json(updatedMember);
        } else {
            res.status(404).json({ message: 'Member not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a member
// @route   DELETE /api/members/:id
// @access  Private
const deleteMember = async (req, res) => {
    try {
        const member = await Member.findById(req.params.id);

        if (member) {
            await member.deleteOne();
            res.json({ message: 'Member removed' });
        } else {
            res.status(404).json({ message: 'Member not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getMembers,
    getMemberById,
    createMember,
    updateMember,
    deleteMember,
};
