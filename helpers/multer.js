
const multer = require('multer');


const storage = multer.memoryStorage();

const limits = {
  files: 4,
  fileSize: 5 * 1024 * 1024, 
};

function fileFilter(req, file, cb) {
  if (/^image\/(png|jpe?g|webp)$/i.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PNG/JPG/WebP images are allowed'), false);
  }
}


const upload = multer({ storage, limits, fileFilter });
module.exports = upload;
