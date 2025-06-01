const mongoose = require('mongoose');

const environmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deviceId: {
    type: String,
    index: true
  },
  location: {
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    accuracy: Number,
    placeName: String,
    country: String,
    administrativeArea: String
  },
  weather: {
    condition: String,
    description: String,
    temperature: Number,
    humidity: Number,
    windSpeed: Number,
    pressure: Number,
    icon: String
  },
  time: {
    timestamp: {
      type: Date,
      default: Date.now
    },
    timeZone: String,
    isDaylight: Boolean,
    timeOfDay: String,
    specialDate: String
  },
  device: {
    type: Object
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 创建地理空间索引
environmentSchema.index({ 'location.coordinates': '2dsphere' });

module.exports = mongoose.model('Environment', environmentSchema);
