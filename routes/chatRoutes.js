const express = require('express');
const router = express.Router();
const { getMessages, searchMessages, deleteMessage, clearChat } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getMessages);
router.get('/search', protect, searchMessages);
router.delete('/clear/:otherUserId', protect, clearChat);
router.delete('/:id', protect, deleteMessage);

module.exports = router;
