import nodemailer from 'nodemailer'

/**
 * 创建一个邮件发送器
 * @param {string | undefined} [pass=process.env.EMAIL_PASS]
 * @param {string | undefined} [user=process.env.EMAIL_USER]
 * @returns {import('nodemailer').Transport}
 */
export const createTransporter = (user = process.env.EMAIL_USER, pass = process.env.EMAIL_PASS) => {
	const transporter = nodemailer.createTransport({
		service: 'qq',
		auth: {
			user,
			pass
		}
	})
	return transporter
}

/**
 * 发送邮件
 * @param 	{import('nodemailer').Transport} transporter
 * @param 	{import('nodemailer').SendMailOptions} mailOptions
 * @returns {Promise<import('nodemailer').SentMessageInfo>}
 */
export const sendMail = (transporter, mailOptions) => {
	const code = mailOptions.code || Math.floor(100000 + Math.random() * 900000)
	const options = Object.assign({}, mailOptions, {
		from: process.env.EMAIL_USER,
		subject: 'Ucc Blog - 邮件验证码',
		html: `
			<pre>
				<h1>
					您的验证码是：<strong>${code}</strong>

					请在 <strong>5</strong> 分钟内完成验证
				</h1>
			</pre>
		`
	})
	transporter = transporter || createTransporter()
	return new Promise((resolve, reject) => {
		transporter.sendMail(options, (err, info) => {
			if (err) {
				reject(err)
			} else {
				resolve(info)
			}
		})
	})
}

