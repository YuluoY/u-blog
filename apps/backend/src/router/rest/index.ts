import express, { type Router } from 'express'
import type { Request, Response } from 'express'
import RestController from '@/controller/rest'

const router = express.Router() as Router

/**
 * 通用查询
 */
router.get('/query', async (req: Request, res: Response) => {
  const data = await RestController.query(req)
  res.json(data)
})

/**
 * 通用删除
 */
router.delete('/del', (req: Request, res: Response) => {

})

/**
 * 通用添加
 */
router.post('/add', (req: Request, res: Response) => {

})

/**
 * 通用修改
 */
router.put('/update', (req: Request, res: Response) => {

})

/**
 * 通用分页查询
 */
router.get('/page', (req: Request, res: Response) => {

})


export default router
