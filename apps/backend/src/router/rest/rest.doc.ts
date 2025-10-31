/**
 * @swagger
 * tags:
 *   name: Rest
 *   description: 通用接口
 */

/**
 * @swagger
 * /rest/{model}/query:
 *   get:
 *     tags: [Rest]
 *     summary: 查询
 *     parameters:
 *       - name: model
 *         in: path
 *         description: 模型名称，表名称
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功获取
 *
 */

/**
 * @swagger
 * /rest/{model}/add:
 *   post:
 *     tags: [Rest]
 *     summary: 添加
 *     responses:
 *       200:
 *         description: 成功添加
 */

/**
 * @swagger
 * /rest/{model}/update:
 *   patch:
 *     tags: [Rest]
 *     summary: 更新
 *     responses:
 *       200:
 *         description: 成功更新
 */

/**
 * @swagger
 * /rest/{model}/del:
 *   delete:
 *     tags: [Rest]
 *     summary: 删除
 *     responses:
 *       200:
 *         description: 成功删除
 */
