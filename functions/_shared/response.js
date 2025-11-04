/**
 * 统一响应格式工具
 * 提供标准化的 API 响应格式
 */

/**
 * 创建成功响应
 * @param {any} data - 响应数据
 * @param {string} message - 响应消息
 * @param {number} status - HTTP 状态码
 * @returns {Response}
 */
export function createSuccessResponse(data = null, message = '操作成功', status = 200) {
  const response = {
    success: true,
    message
  };

  if (data !== null) {
    response.data = data;
  }

  return Response.json(response, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

/**
 * 创建错误响应
 * @param {string} message - 错误消息
 * @param {number} status - HTTP 状态码
 * @param {any} error - 错误详情（可选）
 * @returns {Response}
 */
export function createErrorResponse(message = '操作失败', status = 400, error = null) {
  const response = {
    success: false,
    message
  };

  if (error) {
    response.error = error;
  }

  return Response.json(response, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

