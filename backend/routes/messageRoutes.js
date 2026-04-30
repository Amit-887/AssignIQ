const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getConversation,
  getConversations,
  getOnlineUsers,
  reportMessage,
  deleteMessage,
  uploadChatFile,
  deleteFullConversation
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.use(protect);

router.post('/', sendMessage);
router.post('/upload', upload.single('file'), uploadChatFile);
router.post('/groups', require('../controllers/messageController').createChatGroup);
router.post('/groups/:groupId/members', require('../controllers/messageController').addGroupMember);
router.get('/groups', require('../controllers/messageController').getChatGroups);
router.get('/groups/:groupId/messages', require('../controllers/messageController').getGroupMessages);
router.get('/conversations', getConversations);
router.get('/conversation/:userId', getConversation);
router.get('/online', getOnlineUsers);
router.post('/report', reportMessage);
router.delete('/:id', deleteMessage);
router.delete('/conversation/:userId', deleteFullConversation);

module.exports = router;

