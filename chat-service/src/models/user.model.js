const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    userId: { type: Number, required: true, unique: true }, // Reference to auth service user ID
    email: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: { type: String, enum: ['doctor', 'staff', 'patient'], required: true },
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
    profileImage: { type: String },
    
    // Doctor-specific fields
    specialization: { type: String },
    licenseNumber: { type: String },
    
    // Staff-specific fields
    department: { type: String },
    position: { type: String },
    
    // Patient-specific fields
    dateOfBirth: { type: Date },
    phone: { type: String },
    
    // Chat preferences
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    notificationPreferences: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
