import { Card, Row, Col, Statistic, Table, Tag, List, Avatar, Spin, Space, Badge, Tooltip, Typography, Empty } from 'antd'
import {
  FileTextOutlined,
  UserOutlined,
  CommentOutlined,
  EyeOutlined,
  LikeOutlined,
  TagsOutlined,
  FolderOutlined,
  ClockCircleOutlined,
  LinkOutlined,
  RiseOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  useSiteOverview,
  useTrafficOverview,
  useTrends,
  useRecentArticles,
  useRecentComments,
  usePendingFriendLinks,
  useUserCount,
} from './useDashboardStats'
import { formatDateRelative, formatDateTime } from '../../shared/utils/formatDate'

const { Text, Paragraph } = Typography

/** 状态颜色映射 */
const STATUS_COLOR: Record<string, string> = {
  published: 'green',
  draft: 'orange',
  archived: 'default',
  pending: 'gold',
  approved: 'green',
  rejected: 'red',
}

/** 状态文本映射 */
const STATUS_LABEL: Record<string, string> = {
  published: '已发布',
  draft: '草稿',
  archived: '归档',
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { data: site, isLoading: loadingSite } = useSiteOverview()
  const { data: traffic, isLoading: loadingTraffic } = useTrafficOverview()
  const { data: trends } = useTrends(7)
  const { data: recentArticles } = useRecentArticles()
  const { data: recentComments } = useRecentComments()
  const { data: pendingLinks } = usePendingFriendLinks()
  const { data: userCount } = useUserCount()

  const isLoading = loadingSite || loadingTraffic

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    )
  }

  /** 统计卡片配置 */
  const statCards = [
    { title: t('menu.articles'), value: site?.articleCount ?? 0, icon: <FileTextOutlined />, color: '#1677ff', path: '/articles' },
    { title: t('menu.users'), value: userCount ?? 0, icon: <TeamOutlined />, color: '#52c41a', path: '/users' },
    { title: t('menu.comments'), value: site?.totalComments ?? 0, icon: <CommentOutlined />, color: '#faad14', path: '/comments' },
    { title: '总浏览量', value: site?.totalViews ?? 0, icon: <EyeOutlined />, color: '#722ed1' },
    { title: '总点赞', value: site?.totalLikes ?? 0, icon: <LikeOutlined />, color: '#eb2f96' },
    { title: t('menu.categories'), value: site?.categoryCount ?? 0, icon: <FolderOutlined />, color: '#13c2c2', path: '/categories' },
    { title: t('menu.tags'), value: site?.tagCount ?? 0, icon: <TagsOutlined />, color: '#fa8c16', path: '/tags' },
    { title: '运行天数', value: site?.runningDays ?? 0, icon: <ClockCircleOutlined />, color: '#2f54eb' },
  ]

  /** 流量卡片 */
  const trafficCards = [
    { title: '今日 PV', value: traffic?.todayPv ?? 0, icon: <EyeOutlined />, color: '#1677ff' },
    { title: '今日 UV', value: traffic?.todayUv ?? 0, icon: <UserOutlined />, color: '#52c41a' },
    { title: '今日新用户', value: traffic?.todayNewUsers ?? 0, icon: <RiseOutlined />, color: '#fa541c' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ---- 标题 ---- */}
      <h2 style={{ margin: 0 }}>{t('menu.dashboard')}</h2>

      {/* ---- 站点统计卡片 ---- */}
      <Row gutter={[12, 12]}>
        {statCards.map((item) => (
          <Col xs={12} sm={8} lg={6} xl={3} key={item.title}>
            <Card
              size="small"
              hoverable
              style={{ cursor: item.path ? 'pointer' : 'default' }}
              onClick={() => item.path && navigate(item.path)}
            >
              <Statistic
                title={item.title}
                value={item.value}
                prefix={<span style={{ color: item.color }}>{item.icon}</span>}
                valueStyle={{ fontSize: 22 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* ---- 今日流量 ---- */}
      <Row gutter={[12, 12]}>
        {trafficCards.map((item) => (
          <Col xs={24} sm={8} key={item.title}>
            <Card size="small" hoverable onClick={() => navigate('/analytics')}>
              <Statistic
                title={item.title}
                value={item.value}
                prefix={<span style={{ color: item.color }}>{item.icon}</span>}
                valueStyle={{ fontSize: 24, fontWeight: 600 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* ---- PV/UV 趋势图 ---- */}
      <Card title="近 7 天访问趋势" size="small">
        {trends && trends.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trends} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <ReTooltip />
              <Legend />
              <Area type="monotone" dataKey="pv" name="PV" stroke="#1677ff" fill="#1677ff" fillOpacity={0.15} />
              <Area type="monotone" dataKey="uv" name="UV" stroke="#52c41a" fill="#52c41a" fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <Empty description="暂无趋势数据" />
        )}
      </Card>

      {/* ---- 最近文章 & 最近评论 ---- */}
      <Row gutter={[16, 16]} align="stretch">
        <Col xs={24} lg={12} style={{ display: 'flex' }}>
          <Card
            title="最近文章"
            size="small"
            extra={<a onClick={() => navigate('/articles')}>查看全部</a>}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            styles={{ body: { flex: 1, overflow: 'auto', maxHeight: 420 } }}
          >
            {recentArticles && recentArticles.length > 0 ? (
              <Table
                rowKey="id"
                dataSource={recentArticles}
                pagination={false}
                size="small"
                columns={[
                  {
                    title: '标题',
                    dataIndex: 'title',
                    ellipsis: true,
                    render: (v: string) => <Text ellipsis={{ tooltip: v }}>{v}</Text>,
                  },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    width: 80,
                    align: 'center',
                    render: (v: string) => (
                      <Tag color={STATUS_COLOR[v] || 'default'}>{STATUS_LABEL[v] || v}</Tag>
                    ),
                  },
                  {
                    title: '浏览',
                    dataIndex: 'viewCount',
                    width: 60,
                    align: 'center',
                  },
                  {
                    title: '时间',
                    dataIndex: 'createdAt',
                    width: 100,
                    align: 'center',
                    render: (v: string) => (
                      <Tooltip title={formatDateTime(v)}>{formatDateRelative(v)}</Tooltip>
                    ),
                  },
                ]}
              />
            ) : (
              <Empty description="暂无文章" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12} style={{ display: 'flex' }}>
          <Card
            title="最近评论"
            size="small"
            extra={<a onClick={() => navigate('/comments')}>查看全部</a>}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            styles={{ body: { flex: 1, overflow: 'auto', maxHeight: 420 } }}
          >
            {recentComments && recentComments.length > 0 ? (
              <List
                size="small"
                dataSource={recentComments}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<CommentOutlined />} size="small" />}
                      title={
                        <Space size={4}>
                          <Text strong>{item.nickname || '匿名'}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            <Tooltip title={formatDateTime(item.createdAt)}>
                              {formatDateRelative(item.createdAt)}
                            </Tooltip>
                          </Text>
                        </Space>
                      }
                      description={
                        <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0, fontSize: 13 }}>
                          {item.content}
                        </Paragraph>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无评论" />
            )}
          </Card>
        </Col>
      </Row>

      {/* ---- 待审友链 ---- */}
      {pendingLinks && pendingLinks.length > 0 && (
        <Card
          title={
            <Space>
              <LinkOutlined />
              待审核友链
              <Badge count={pendingLinks.length} style={{ marginLeft: 4 }} />
            </Space>
          }
          size="small"
          extra={<a onClick={() => navigate('/friend-links')}>去审核</a>}
        >
          <List
            size="small"
            dataSource={pendingLinks}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    item.icon
                      ? <Avatar src={item.icon} size="small" />
                      : <Avatar icon={<LinkOutlined />} size="small" />
                  }
                  title={
                    <a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a>
                  }
                  description={item.description || item.url}
                />
                <Tooltip title={formatDateTime(item.createdAt)}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {formatDateRelative(item.createdAt)}
                  </Text>
                </Tooltip>
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  )
}
