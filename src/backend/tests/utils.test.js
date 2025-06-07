const { validateAudioFile, generateUniqueId } = require('../utils/helpers');

describe('Utility Functions', () => {
  describe('validateAudioFile', () => {
    test('should validate audio file format', () => {
      const validFile = {
        mimetype: 'audio/wav',
        size: 1024000 // 1MB
      };
      
      expect(validateAudioFile(validFile)).toBe(true);
    });

    test('should reject non-audio files', () => {
      const invalidFile = {
        mimetype: 'image/jpeg',
        size: 1024000
      };
      
      expect(validateAudioFile(invalidFile)).toBe(false);
    });

    test('should reject files that are too large', () => {
      const largeFile = {
        mimetype: 'audio/wav',
        size: 50 * 1024 * 1024 // 50MB
      };
      
      expect(validateAudioFile(largeFile)).toBe(false);
    });
  });

  describe('generateUniqueId', () => {
    test('should generate unique IDs', () => {
      const id1 = generateUniqueId();
      const id2 = generateUniqueId();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });
  });
});
