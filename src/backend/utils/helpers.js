const { v4: uuidv4 } = require('uuid');

/**
 * Validate audio file format and size
 * @param {Object} file - Multer file object
 * @returns {boolean} - True if valid, false otherwise
 */
function validateAudioFile(file) {
  if (!file) return false;
  
  // Check file type
  const allowedTypes = [
    'audio/wav',
    'audio/mpeg',
    'audio/mp3',
    'audio/mp4',
    'audio/webm',
    'audio/ogg'
  ];
  
  if (!allowedTypes.includes(file.mimetype)) {
    return false;
  }
  
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    return false;
  }
  
  return true;
}

/**
 * Generate a unique ID
 * @returns {string} - Unique identifier
 */
function generateUniqueId() {
  return uuidv4();
}

/**
 * Sanitize filename for safe storage
 * @param {string} filename - Original filename
 * @returns {string} - Sanitized filename
 */
function sanitizeFilename(filename) {
  if (!filename) return 'unnamed';
  
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

/**
 * Format file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted size string
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if environment is development
 * @returns {boolean} - True if development environment
 */
function isDevelopment() {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if environment is test
 * @returns {boolean} - True if test environment
 */
function isTest() {
  return process.env.NODE_ENV === 'test';
}

module.exports = {
  validateAudioFile,
  generateUniqueId,
  sanitizeFilename,
  formatFileSize,
  isDevelopment,
  isTest
};
