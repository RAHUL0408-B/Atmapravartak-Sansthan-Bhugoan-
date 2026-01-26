const express = require('express');
const router = express.Router();
const {
    getMembers,
    getMemberById,
    createMember,
    updateMember,
    deleteMember,
} = require('../controllers/memberController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getMembers).post(protect, createMember);
router
    .route('/:id')
    .get(protect, getMemberById)
    .put(protect, updateMember)
    .delete(protect, deleteMember);

module.exports = router;
