const express = require('express');
const router = express.Router();
const { uploadImage, uploadVideo } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storageImages = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads/images');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const storageVideos = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads/videos');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const uploadImg = multer({ storage: storageImages });
const uploadVid = multer({ storage: storageVideos });

router.post('/image', protect, uploadImg.single('image'), uploadImage);
router.post('/video', protect, uploadVid.single('video'), uploadVideo);

module.exports = router;
