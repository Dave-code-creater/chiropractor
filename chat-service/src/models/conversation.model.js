const mongoose = require('mongoose');
const { Schema } = mongoose;

const ConversationSchema = new Schema(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    type: { 
      type: String, 
      enum: ['direct', 'appointment', 'group', 'emergency'], 
      default: 'direct' 
    },
    title: { type: String }, // For group chats or appointment-specific chats
    appointmentId: { type: Number }, // Reference to appointment service
    lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
    isActive: { type: Boolean, default: true },
    
    // Soft delete fields
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    
    // Metadata for different conversation types
    metadata: {
      description: { type: String },
      participantType: { type: String, enum: ['doctor', 'staff', 'admin'] },
      appointmentDate: { type: Date },
      doctorId: { type: Number },
      patientId: { type: Number },
      priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Conversation', ConversationSchema);
