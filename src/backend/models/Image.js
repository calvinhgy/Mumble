const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deviceId: {
    type: String,
    index: true
  },
  audioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Audio'
  },
  environmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Environment'
  },
  fileName: String,
  imageUrl: String,
  thumbnailUrl: String,
  promptText: String,
  stylePreference: {
    type: String,
    default: 'balanced'
  },
  status: {
    type: String,
    enum: ['queued', 'processing', 'completed', 'error'],
    default: 'queued',
    index: true
  },
  error: String,
  generatedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// 虚拟属性：图像ID（用于前端）
imageSchema.virtual('imageId').get(function() {
  return this._id.toString();
});

// 确保虚拟属性包含在JSON输出中
imageSchema.set('toJSON', { virtuals: true });
imageSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Image', imageSchema);
