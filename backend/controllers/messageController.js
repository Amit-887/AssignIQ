const Message = require('../models/Message');
const User = require('../models/User');
const Report = require('../models/Report');
const mongoose = require('mongoose');

// @desc    Send message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content, messageType, groupId, chatGroupId, attachments } = req.body;

    const message = await Message.create({
      sender: req.user.id,
      receiver: receiverId,
      group: groupId,
      chatGroup: chatGroupId,
      content,
      messageType: messageType || 'text',
      attachments: attachments || []
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email profilePicture')
      .populate('receiver', 'name email profilePicture');

    // Emit socket event for real-time delivery
    if (req.io) {
      if (chatGroupId) {
        // Need to require ChatGroup here because require at bottom is out of scope
        const ChatGrp = require('../models/ChatGroup');
        const group = await ChatGrp.findById(chatGroupId);
        if (group) {
          group.members.forEach(memberId => {
            if (memberId.toString() !== req.user.id.toString()) {
              req.io.to(memberId.toString()).emit('newMessage', populatedMessage);
            }
          });
        }
      } else if (receiverId) {
        req.io.to(receiverId).emit('newMessage', populatedMessage);
      }
    }

    res.status(201).json({
      success: true,
      data: populatedMessage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get conversation with another user
// @route   GET /api/messages/conversation/:userId
// @access  Private
exports.getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: userId },
        { sender: userId, receiver: req.user.id }
      ]
    })
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('sender', 'name email profilePicture');

    // Mark messages as read
    await Message.updateMany(
      {
        sender: userId,
        receiver: req.user.id,
        isRead: false
      },
      { isRead: true }
    );

    const total = await Message.countDocuments({
      $or: [
        { sender: req.user.id, receiver: userId },
        { sender: userId, receiver: req.user.id }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        messages: messages.reverse(),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all conversations for user
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: userId },
            { receiver: userId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ['$sender', userId] },
              then: '$receiver',
              else: '$sender'
            }
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: {
                if: {
                  $and: [
                    { $eq: ['$receiver', userId] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                then: 1,
                else: 0
              }
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'contact'
        }
      },
      {
        $unwind: '$contact'
      },
      {
        $project: {
          _id: 0,
          contactId: '$_id',
          contact: {
            name: '$contact.name',
            email: '$contact.email',
            profilePicture: '$contact.profilePicture',
            role: '$contact.role'
          },
          lastMessage: {
            content: '$lastMessage.content',
            messageType: '$lastMessage.messageType',
            createdAt: '$lastMessage.createdAt'
          },
          unreadCount: 1
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: conversations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get online users
// @route   GET /api/messages/online
// @access  Private
exports.getOnlineUsers = async (req, res) => {
  try {
    const userContacts = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(req.user.id) },
            { receiver: new mongoose.Types.ObjectId(req.user.id) }
          ]
        }
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ['$sender', new mongoose.Types.ObjectId(req.user.id)] },
              then: '$receiver',
              else: '$sender'
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          userId: '$_id',
          name: '$user.name',
          email: '$user.email',
          profilePicture: '$user.profilePicture',
          role: '$user.role'
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: userContacts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Report message
// @route   POST /api/messages/report
// @access  Private
exports.reportMessage = async (req, res) => {
  try {
    const { messageId, reason, description } = req.body;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Mark message as reported
    message.isReported = true;
    message.reportReason = reason;
    message.reportDate = Date.now();
    await message.save();

    // Create report
    const report = await Report.create({
      reporter: req.user.id,
      reportedUser: message.sender,
      message: messageId,
      reason,
      description
    });

    res.status(201).json({
      success: true,
      message: 'Message reported successfully',
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Private
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }

    await message.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Upload file for chat (up to 50MB) 
// @route   POST /api/messages/upload
// @access  Private
exports.uploadChatFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    
    res.status(200).json({
      success: true,
      data: {
        url: fileUrl,
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete full conversation with another user
// @route   DELETE /api/messages/conversation/:userId
// @access  Private
exports.deleteFullConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    
    await Message.deleteMany({
      $or: [
        { sender: req.user.id, receiver: userId },
        { sender: userId, receiver: req.user.id }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const ChatGroup = require('../models/ChatGroup');

// @desc    Create a chat group
// @route   POST /api/messages/groups
// @access  Private
exports.createChatGroup = async (req, res) => {
  try {
    const { name, description, memberIds } = req.body;
    
    // memberIds should be an array of user IDs
    const members = memberIds || [];
    if (!members.includes(req.user.id)) {
      members.push(req.user.id);
    }

    const group = await ChatGroup.create({
      name,
      description,
      creator: req.user.id,
      members
    });

    res.status(201).json({
      success: true,
      data: group
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get chat groups for user
// @route   GET /api/messages/groups
// @access  Private
exports.getChatGroups = async (req, res) => {
  try {
    const groups = await ChatGroup.find({ members: req.user.id });
    res.status(200).json({
      success: true,
      data: groups
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get group messages
// @route   GET /api/messages/groups/:groupId/messages
// @access  Private
exports.getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const group = await ChatGroup.findById(groupId);
    if (!group || !group.members.includes(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not a member of this group' });
    }

    const messages = await Message.find({ chatGroup: groupId })
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('sender', 'name email profilePicture');

    const total = await Message.countDocuments({ chatGroup: groupId });

    res.status(200).json({
      success: true,
      data: {
        messages: messages.reverse(),
        pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add member to a chat group
// @route   POST /api/messages/groups/:groupId/members
// @access  Private
exports.addGroupMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberIds } = req.body;

    const group = await ChatGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (group.creator.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Only group creator can add members' });
    }

    const newMembers = memberIds.filter(id => !group.members.some(m => m.toString() === id.toString()));
    if (newMembers.length > 0) {
      group.members.push(...newMembers);
      await group.save();
    }

    res.status(200).json({ success: true, data: group });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = exports;

