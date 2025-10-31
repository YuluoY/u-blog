
/**
 * 判断是否是 ECMAScript 模块环境
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-10-15
 * @return      {boolean}  如果是 ECMAScript 模块环境则返回 true，否则返回 false
 */
export const isESM = (): boolean =>
{
  try {
    // 检查 CommonJS 环境
    if (typeof require === 'function' && typeof module !== 'undefined' && module.exports) {
      return false
    }
    
    // 检查 ESM 环境 - 使用 Function 构造器来安全检查 import.meta，避免在 CJS 中直接访问导致语法错误
    if (typeof Function !== 'undefined') {
      try {
        // 使用 Function 构造器在运行时检查，而不是在解析时
        const checkImportMeta = new Function('try { return typeof import.meta !== "undefined" } catch { return false }')
        if (checkImportMeta()) {
          return true
        }
      } catch {
        // 如果无法执行，说明是 CommonJS 环境
      }
    }
    
    // 浏览器环境检查
    if (typeof document !== 'undefined' && document.currentScript?.type === 'module') {
      return true
    }
    
    // Node.js ESM 检查 - 通过检查 __dirname 和 __filename 是否存在
    // 在 ESM 中，这些变量不存在（除非通过 import.meta.url 创建）
    try {
      // @ts-ignore - 检查 CommonJS 全局变量
      if (typeof __dirname !== 'undefined' || typeof __filename !== 'undefined') {
        return false
      }
    } catch {
      // 如果抛出错误，说明可能是 ESM 环境
    }
    
  } catch (error) {
    return false
  }

  return false
}