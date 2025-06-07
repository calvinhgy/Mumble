// Test setup file
require('dotenv').config({ path: '.env.test' });

// Mock external services for testing
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    audio: {
      transcriptions: {
        create: jest.fn().mockResolvedValue({
          text: 'Mock transcription result'
        })
      }
    },
    images: {
      generate: jest.fn().mockResolvedValue({
        data: [{
          url: 'https://mock-image-url.com/image.jpg'
        }]
      })
    }
  }))
}));

// Mock axios for external API calls
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({
    data: {
      weather: [{ main: 'Clear', description: 'clear sky' }],
      main: { temp: 25, humidity: 60 },
      name: 'Mock City'
    }
  }))
}));

// Global test timeout
jest.setTimeout(10000);
