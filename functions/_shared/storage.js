/**
 * Cloudflare KV 存储工具函数
 *
 * 使用说明：
 * 1. 在 wrangler.toml 中配置 KV Namespace 绑定
 * 2. 将绑定名称替换下面的 KV_BINDING 常量
 * 3. 根据需要修改默认 key 名称
 */

// TODO: 修改为你的 KV 绑定名称（与 wrangler.toml 中的 binding 一致）
const KV_BINDING = 'APP_KV';
const DEFAULT_KEY = 'data';

/**
 * 从 KV 读取数据
 * @param {Object} env - Cloudflare 环境变量 (包含 KV 绑定)
 * @param {string} [key] - KV key，默认 'data'
 * @returns {Promise<Array|Object>} 返回数组或对象，取决于存储的数据类型
 */
export async function getItems(env, key = DEFAULT_KEY) {
  try {
    const kv = env[KV_BINDING];
    if (!kv) {
      console.error(`KV 绑定 ${KV_BINDING} 不存在`);
      return [];
    }

    const data = await kv.get(key, { type: 'json' });

    // 根据 key 返回默认值
    if (key === DEFAULT_KEY) {
      return data || [];
    } else {
      return data || {};
    }
  } catch (error) {
    console.error(`读取 KV 数据失败 (key: ${key}):`, error);
    return key === DEFAULT_KEY ? [] : {};
  }
}

/**
 * 写入数据到 KV
 * @param {Object} env - Cloudflare 环境变量
 * @param {Array|Object} data - 要写入的数据（数组或对象）
 * @param {string} [key] - KV key，默认 'data'
 * @returns {Promise<boolean>} 是否写入成功
 */
export async function setItems(env, data, key = DEFAULT_KEY) {
  try {
    const kv = env[KV_BINDING];
    if (!kv) {
      console.error(`KV 绑定 ${KV_BINDING} 不存在`);
      return false;
    }

    await kv.put(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`写入 KV 数据失败 (key: ${key}):`, error);
    return false;
  }
}

/**
 * 删除 KV 中的数据
 * @param {Object} env - Cloudflare 环境变量
 * @param {string} key - KV key
 * @returns {Promise<boolean>} 是否删除成功
 */
export async function deleteItem(env, key) {
  try {
    const kv = env[KV_BINDING];
    if (!kv) {
      console.error(`KV 绑定 ${KV_BINDING} 不存在`);
      return false;
    }

    await kv.delete(key);
    return true;
  } catch (error) {
    console.error(`删除 KV 数据失败 (key: ${key}):`, error);
    return false;
  }
}

