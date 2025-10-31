import swaggerJSDoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import appCfg from '@/app'
import type { Application } from 'express'

const swaggerDocs = swaggerJSDoc(appCfg.plugins.swagger)

export const Swagger = {
	install (app: Application) {
		console.log(`Swagger started, by http://localhost:${appCfg.port}${appCfg.plugins.swagger.url}`)
		app.use(appCfg.plugins.swagger.url, swaggerUi.serve, swaggerUi.setup(swaggerDocs))
	}
}
