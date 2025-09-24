import Message from '../models/Message.js';


export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: currentUser, receiver: userId },
        { sender: userId, receiver: currentUser }
      ]
    })
    .populate('sender', 'name avatar')
    .populate('receiver', 'name avatar')
    .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { receiverId, content, fileUrl, fileName, fileType } = req.body;

    const message = new Message({
      sender: req.user._id,
      receiver: receiverId,
      content,
      fileUrl,
      fileName,
      fileType
    });

    await message.save();
    await message.populate('sender', 'name avatar');
    await message.populate('receiver', 'name avatar');

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const fileName = req.file.originalname;
    
    let fileType = 'document';
    if (req.file.mimetype.startsWith('image/')) {
      fileType = 'image';
    } else if (req.file.mimetype.startsWith('video/')) {
      fileType = 'video';
    } else if (req.file.mimetype.startsWith('audio/')) {
      fileType = 'audio';
    }

    res.json({
      fileUrl,
      fileName,
      fileType
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};