/**
 * 健康检查端点
 * GET /api/health
 *
 * 示例 API 端点，可用于检查服务是否正常运行
 */

import { createSuccessResponse } from '../_shared/response.js';

export async function onRequestGet() {
  return createSuccessResponse(
    {
      timestamp: new Date().toISOString(),
      status: 'healthy'
    },
    '服务器运行正常'
  );
}

