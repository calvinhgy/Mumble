/**
 * 创建标准错误对象
 * @param {number} statusCode - HTTP状态码
 * @param {string} code - 错误代码
 * @param {string} message - 错误消息
 * @param {Object} details - 错误详情
 * @returns {Error} 标准错误对象
 */
exports.createError = (statusCode, code, message, details = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  if (details) {
    error.details = details;
  }
  return error;
};

/**
 * 常见错误类型
 */
exports.errorTypes = {
  // 认证错误
  UNAUTHORIZED: { statusCode: 401, code: 'UNAUTHORIZED', message: 'Authentication required' },
  FORBIDDEN: { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied' },
  
  // 资源错误
  NOT_FOUND: { statusCode: 404, code: 'NOT_FOUND', message: 'Resource not found' },
  CONFLICT: { statusCode: 409, code: 'CONFLICT', message: 'Resource conflict' },
  
  // 请求错误
  BAD_REQUEST: { statusCode: 400, code: 'BAD_REQUEST', message: 'Invalid request' },
  VALIDATION_ERROR: { statusCode: 400, code: 'VALIDATION_ERROR', message: 'Validation failed' },
  
  // 服务器错误
  INTERNAL_ERROR: { statusCode: 500, code: 'INTERNAL_ERROR', message: 'Internal server error' },
  SERVICE_UNAVAILABLE: { statusCode: 503, code: 'SERVICE_UNAVAILABLE', message: 'Service temporarily unavailable' },
  
  // 第三方服务错误
  EXTERNAL_SERVICE_ERROR: { statusCode: 502, code: 'EXTERNAL_SERVICE_ERROR', message: 'External service error' },
  
  // 速率限制
  RATE_LIMIT_EXCEEDED: { statusCode: 429, code: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded' }
};

/**
 * 创建预定义错误
 * @param {string} type - 错误类型
 * @param {string} message - 自定义错误消息（可选）
 * @param {Object} details - 错误详情（可选）
 * @returns {Error} 标准错误对象
 */
exports.createPredefinedError = (type, message = null, details = null) => {
  const errorType = exports.errorTypes[type];
  
  if (!errorType) {
    return exports.createError(500, 'UNKNOWN_ERROR', 'Unknown error type', { type });
  }
  
  return exports.createError(
    errorType.statusCode,
    errorType.code,
    message || errorType.message,
    details
  );
};
