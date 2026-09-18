import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

export const uploadCsv = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // Max 50MB
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.csv' && file.mimetype !== 'text/csv' && file.mimetype !== 'application/vnd.ms-excel') {
      return cb(new Error('Only .csv files are supported.'));
    }
    cb(null, true);
  },
});
