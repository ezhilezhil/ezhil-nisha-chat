const express = require('express');
const router = express.Router();
const { login, getProfile, updateProfile, getOtherProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', login);
router.get('/profile', protect, getProfile);
router.get('/profile/:id', protect, getOtherProfile);
router.put('/profile', protect, updateProfile);

module.exports = router;
