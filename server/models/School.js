const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  location: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    }
  },
  address: {
    street: String,
    village: String,
    block: {
      type: String,
      required: true
    },
    district: {
      type: String,
      required: true
    },
    state: {
      type: String,
      default: 'Bihar'
    },
    pincode: String
  },
  principal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  teachers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  totalTeachers: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  boundaryRadius: {
    type: Number,
    default: 100,
    comment: 'Boundary radius in meters for geo-fencing'
  }
}, {
  timestamps: true
});

// Index for efficient queries
schoolSchema.index({ 'address.district': 1, 'address.block': 1 });
schoolSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('School', schoolSchema); 