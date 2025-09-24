import express from 'express';
import { getMessages, sendMessage, uploadFile } from '../controllers/messageController.js';
import auth from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/:userId', auth, getMessages);
router.post('/send', auth, sendMessage);
router.post('/upload', auth, upload.single('file'), uploadFile);

export default router;