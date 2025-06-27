const mongoose = require('mongoose');
const { Schema } = mongoose;

const MessageSchema = new Schema({
  conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  messageType: { 
    type: String, 
    enum: ['text', 'image', 'file', 'appointment', 'system'], 
    default: 'text' 
  },
  senderType: { 
    type: String, 
    enum: ['user', 'doctor', 'staff', 'admin', 'system'], 
    default: 'user' 
  },
  timestamp: { type: Date, default: Date.now },
  
  // Read/delivery tracking
  readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  readAt: { type: Date },
  deliveredTo: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  deliveredAt: { type: Date },
  
  // Message metadata
  metadata: {
    ipAddress: { type: String },
    userAgent: { type: String },
    edited: { type: Boolean, default: false },
    editedAt: { type: Date },
    replyTo: { type: Schema.Types.ObjectId, ref: 'Message' }
  }
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);
