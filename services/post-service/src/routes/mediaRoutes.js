const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Ensure uploads directory exists
const uploadDir = require('path').resolve(__dirname, '../../uploads');
console.log('UPLOAD DIR:', uploadDir);
console.log('UPLOAD DIR:', uploadDir);
console.log('UPLOAD DIR:', uploadDir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Use timestamp + original name for uniqueness
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});

const upload = multer({ storage });

// POST /media/upload
router.post('/upload', upload.array('media'), (req, res) => {
  console.log('Uploaded files:', req.files.map(f => f.path));
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded' });
  }
  // Return URLs for uploaded files
  const urls = req.files.map(file => `${process.env.MEDIA_BASE_URL || 'http://localhost:5003'}/uploads/${file.filename}`);
  res.json({ urls });
});

module.exports = router;
