const mongoose = require('mongoose');

const audioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deviceId: {
    type: String,
    index: true
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  text: {
    type: String
  },
  analysis: {
    sentiment: String,
    keywords: [String],
    themes: [String]
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'error'],
    default: 'processing'
  },
  error: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date
  }
});

// 设置TTL索引，自动删除过期的音频文件
audioSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// 设置过期时间的中间件
audioSchema.pre('save', function(next) {
  if (!this.expiresAt) {
    // 默认7天后过期
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    this.expiresAt = expiryDate;
  }
  next();
});

module.exports = mongoose.model('Audio', audioSchema);
