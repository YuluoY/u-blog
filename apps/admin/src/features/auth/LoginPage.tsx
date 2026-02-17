import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Form, Input, Button, Card } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuth } from './AuthContext'

const DEV_CREDENTIALS = { username: 'admin', password: '123456' }

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const { message } = App.useApp()

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      await login(values.username.trim(), values.password)
      message.success(t('app.loginSuccess'))
      navigate('/dashboard')
    } catch (err) {
      message.error(err instanceof Error ? err.message : t('app.loginFail'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <Card title={t('app.loginTitle')} className="login-card" style={{ width: 400 }}>
        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
          layout="vertical"
          initialValues={import.meta.env.DEV ? DEV_CREDENTIALS : undefined}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: t('login.usernameRequired') }]}
          >
            <Input prefix={<UserOutlined />} placeholder={t('login.usernamePlaceholder')} />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: t('login.passwordRequired') }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder={t('login.passwordPlaceholder')} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {t('common.login')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
