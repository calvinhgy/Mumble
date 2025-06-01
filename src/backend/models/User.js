const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  preferences: {
    imageStyle: {
      type: String,
      enum: ['balanced', 'realistic', 'artistic', 'abstract'],
      default: 'balanced'
    },
    privacySettings: {
      saveAudioRecordings: {
        type: Boolean,
        default: false
      },
      locationPrecision: {
        type: String,
        enum: ['exact', 'city', 'none'],
        default: 'city'
      },
      shareAnalyticsData: {
        type: Boolean,
        default: true
      }
    },
    notifications: {
      imageGeneration: {
        type: Boolean,
        default: true
      },
      newFeatures: {
        type: Boolean,
        default: false
      }
    }
  }
});

// 更新最后活动时间的中间件
userSchema.pre('save', function(next) {
  this.lastActive = new Date();
  next();
});

// 根据设备ID查找或创建用户
userSchema.statics.findOrCreateByDeviceId = async function(deviceId) {
  let user = await this.findOne({ deviceId });
  
  if (!user) {
    user = new this({ deviceId });
    await user.save();
  }
  
  return user;
};

module.exports = mongoose.model('User', userSchema);
