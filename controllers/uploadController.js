const uploadImage = (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
    const url = `/uploads/images/${req.file.filename}`;
    res.json({ url });
};

const uploadVideo = (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No video uploaded' });
    const url = `/uploads/videos/${req.file.filename}`;
    res.json({ url });
};

module.exports = { uploadImage, uploadVideo };
