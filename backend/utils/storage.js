// storage.js

import { Storage } from '@google-cloud/storage';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import dotenv from 'dotenv';
dotenv.config();

const storage = new Storage({
  keyFilename: 'gcs-key.json',
});

const bucketName = process.env.BUCKET_NAME;
const bucket = storage.bucket(bucketName);

const multerStorage = multer.memoryStorage();

const uploadHandler = multer({ storage: multerStorage });

const uploadToGCS = (file) => {
  return new Promise((resolve, reject) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;

    const blob = bucket.file(filename);
    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: file.mimetype,
      metadata: {
        cacheControl: 'public, max-age=31536000',
        // Jangan pakai predefinedAcl atau ACL apapun
      },
    });

    blobStream.on('error', (err) => reject(err));

    blobStream.on('finish', () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
      resolve(publicUrl);
    });

    blobStream.end(file.buffer);
  });
};

export { uploadHandler, uploadToGCS };
