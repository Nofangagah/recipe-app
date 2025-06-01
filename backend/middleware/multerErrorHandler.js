// middlewares/multerErrorHandler.js
import multer from 'multer';

 const multerErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Ukuran file melebihi batas maksimal 5MB' });
    }
  }

  if (err) {
    return res.status(400).json({ message: err.message });
  }

  next();
};
export default multerErrorHandler;
