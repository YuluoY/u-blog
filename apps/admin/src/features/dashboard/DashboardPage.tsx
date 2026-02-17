import { Card, Row, Col, Spin } from 'antd'
import { FileTextOutlined, UserOutlined, CommentOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useDashboardStats } from './useDashboardStats'

export default function DashboardPage() {
  const { t } = useTranslation()
  const { data: stats, isLoading } = useDashboardStats()

  if (isLoading || !stats) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>{t('menu.dashboard')}</h2>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Card.Meta
              avatar={<FileTextOutlined style={{ fontSize: 32, color: '#1890ff' }} />}
              title={t('menu.articles')}
              description={<span style={{ fontSize: 28, fontWeight: 700 }}>{stats.articles}</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Card.Meta
              avatar={<UserOutlined style={{ fontSize: 32, color: '#52c41a' }} />}
              title={t('menu.users')}
              description={<span style={{ fontSize: 28, fontWeight: 700 }}>{stats.users}</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Card.Meta
              avatar={<CommentOutlined style={{ fontSize: 32, color: '#faad14' }} />}
              title={t('menu.comments')}
              description={<span style={{ fontSize: 28, fontWeight: 700 }}>{stats.comments}</span>}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
