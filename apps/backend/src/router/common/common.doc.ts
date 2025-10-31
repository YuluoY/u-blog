/**
 * @swagger
 * tags:
 *   name: Common
 *   description: 一般接口
 */

/**
 * @swagger
 * /image/{path}:
 *   get:
 *     tags: [Common]
 *     summary: 获取图片
 *     parameters:
 *       - name: path
 *         in: path
 *         description: 图片路径
 *         required: true
 *         schema:
 *           type: string
 *       - name: w
 *         in: query
 *         description: 图片宽度
 *         required: false
 *         schema:
 *           type: string
 *       - name: h
 *         in: query
 *         description: 图片高度
 *         required: false
 *         schema:
 *            type: string
 *       - name: q
 *         in: query
 *         description: 图片质量，区间：(0,100]
 *         required: false
 *         schema:
 *           type: string
 *       - name: s
 *         in: query
 *         description: 图片尺寸，优先级高于w和h
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功获取
 *       404:
 *         description: 图片不存在
 */
