// 健康检查Lambda函数

const { success, failure } = require('../common/response');

exports.main = async (event) => {
  try {
    console.log('Health check request:', JSON.stringify(event, null, 2));

    const response = {
      status: 'healthy',
      service: 'mumble-serverless',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      stage: process.env.STAGE,
      region: process.env.REGION,
      environment: {
        dynamodbTable: process.env.DYNAMODB_TABLE,
        imagesBucket: process.env.IMAGES_BUCKET,
        audioBucket: process.env.AUDIO_BUCKET
      },
      requestId: event.requestContext?.requestId || 'unknown'
    };

    console.log('Health check response:', response);
    return success(response);
  } catch (error) {
    console.error('Health check failed:', error);
    return failure({ 
      error: 'Health check failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
