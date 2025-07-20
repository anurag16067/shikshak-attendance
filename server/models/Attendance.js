const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  checkInTime: {
    type: Date,
    required: true
  },
  checkOutTime: {
    type: Date
  },
  checkOutLocation: {
    latitude: {
      type: Number
    },
    longitude: {
      type: Number
    },
    address: String
  },
  checkOutPhoto: {
    url: String,
    publicId: String
  },
  checkOutDistance: {
    type: Number,
    comment: 'Distance in meters from school boundary during check-out'
  },
  checkOutIsWithinBoundary: {
    type: Boolean,
    default: false
  },
  location: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    address: String
  },
  photo: {
    url: {
      type: String,
      required: true
    },
    publicId: String
  },
  distance: {
    type: Number,
    required: true,
    comment: 'Distance in meters from school boundary'
  },
  isWithinBoundary: {
    type: Boolean,
    required: true,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  remarks: String,
  deviceInfo: {
    userAgent: String,
    platform: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
attendanceSchema.index({ teacher: 1, checkInTime: -1 });
attendanceSchema.index({ school: 1, checkInTime: -1 });
attendanceSchema.index({ status: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema); 