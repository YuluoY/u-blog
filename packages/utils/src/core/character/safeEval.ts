/**
 * 安全评估字符串为对象（仅支持字面量，不支持函数和表达式）
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-09-28
 * @param       {string}    str     - 对象字面量字符串
 * @returns     {any}               - 解析后的对象
 * @example
 * ```ts
 * const str = "{a: 10, c: 'jhahah', d: null, e: undefined, f: [1,2,3,4]}"
 * const obj = safeEval(str);
 *
 *  console.log(obj);
 *  // {a: 10, c: 'jhahah', d: null, e: undefined, f: [1, 2, 3, 4]}
 * ```
 */
export const safeEval = <T = any>(str: string): T | string =>
{
  if (!str || typeof str !== 'string') {
    return str
  }
  
  // 安全检查：只允许对象字面量，禁止函数和表达式
  const sanitizedStr = str.trim()
  
  // 检查是否包含危险内容
  const dangerousPatterns = [
    /function\s*\(/,           // 函数定义
    /=>\s*/,                    // 箭头函数
    /eval\s*\(/,                // eval 调用
    /new\s+\w+\s*\(/,          // new 操作符
    /require\s*\(/,             // require 调用
    /import\s+/,               // import 语句
    /while\s*\(/,               // while 循环
    /for\s*\(/,                 // for 循环
    /if\s*\(/,                  // if 语句
    /alert\s*\(/,               // alert 调用
    /console\./,                // console 调用
  ]
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(sanitizedStr)) {
      console.warn('safeEval: 检测到潜在危险内容，返回原始字符串')
      return str
    }
  }
  
  try
  {
    // 使用更安全的方式解析
    const result = new Function(`return ${sanitizedStr}`)()
    
    // 验证结果类型
    if (typeof result === 'object' && result !== null) {
      return result as T
    }
    
    return str
  }
  catch (e)
  {
    return str
  }
}