import { useMemo, useState } from 'react'
import {
  Card,
  Col,
  Input,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  ClockCircleOutlined,
  FileSearchOutlined,
  GlobalOutlined,
  LinkOutlined,
} from '@ant-design/icons'
import { useCrawlerOverview, useCrawlerLogs } from './useCrawlerMonitor'
import { type CrawlerLogItem, type CrawlerLogParams } from './api'

function formatBytes(val: number | null) {
  if (!val || val <= 0) return '-'
  if (val < 1024) return `${val} B`
  if (val < 1024 * 1024) return `${(val / 1024).toFixed(1)} KB`
  return `${(val / 1024 / 1024).toFixed(2)} MB`
}

export default function CrawlerMonitorPage() {
  const [params, setParams] = useState<CrawlerLogParams>({ page: 1, pageSize: 20 })

  const { data: overview, isLoading: loadingOverview } = useCrawlerOverview()
  const { data: logsData, isLoading: loadingLogs } = useCrawlerLogs(params)

  const botOptions = useMemo(
    () => (overview?.topBots || []).map((item) => ({ label: `${item.bot} (${item.count})`, value: item.bot })),
    [overview?.topBots],
  )

  const columns: ColumnsType<CrawlerLogItem> = useMemo(() => [
    {
      title: '爬虫',
      dataIndex: 'bot',
      width: 140,
      render: (value: string) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: '路径',
      dataIndex: 'path',
      width: 220,
      ellipsis: true,
      render: (value: string | null) => value || '-',
    },
    {
      title: 'IP / 地区',
      key: 'ipLocation',
      width: 220,
      render: (_value, row) => <span>{row.ip || '-'} {row.location ? `· ${row.location}` : ''}</span>,
    },
    {
      title: '缓存',
      dataIndex: 'cacheHit',
      width: 90,
      render: (value: boolean) => <Tag color={value ? 'success' : 'default'}>{value ? 'HIT' : 'MISS'}</Tag>,
    },
    {
      title: '渲染耗时',
      dataIndex: 'renderMs',
      width: 100,
      render: (value: number | null) => (typeof value === 'number' ? `${value}ms` : '-'),
    },
    {
      title: 'HTML大小',
      dataIndex: 'htmlBytes',
      width: 110,
      render: (value: number | null) => formatBytes(value),
    },
    {
      title: '状态码',
      dataIndex: 'statusCode',
      width: 90,
      render: (value: number | null) => value ?? '-',
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 170,
      render: (value: string) => (value ? new Date(value).toLocaleString('zh-CN') : '-'),
    },
  ], [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Spin spinning={loadingOverview}>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={12} lg={6}>
            <Card size="small" hoverable>
              <Statistic title="累计SEO抓取" value={overview?.totalVisits ?? 0} prefix={<GlobalOutlined />} />
            </Card>
          </Col>
          <Col xs={12} sm={12} lg={6}>
            <Card size="small" hoverable>
              <Statistic title="今日SEO抓取" value={overview?.todayVisits ?? 0} prefix={<ClockCircleOutlined />} />
            </Card>
          </Col>
          <Col xs={12} sm={12} lg={6}>
            <Card size="small" hoverable>
              <Statistic title="爬虫种类" value={overview?.uniqueBots ?? 0} prefix={<FileSearchOutlined />} />
            </Card>
          </Col>
          <Col xs={12} sm={12} lg={6}>
            <Card size="small" hoverable>
              <Statistic title="已抓取路径" value={overview?.uniquePaths ?? 0} prefix={<LinkOutlined />} />
            </Card>
          </Col>
        </Row>
      </Spin>

      <Card
        title="SEO抓取日志"
        extra={
          <Space>
            <Select
              allowClear
              placeholder="筛选爬虫"
              style={{ width: 180 }}
              options={botOptions}
              value={params.bot || undefined}
              onChange={(value) => setParams((prev) => ({ ...prev, bot: value || undefined, page: 1 }))}
            />
            <Input.Search
              allowClear
              placeholder="按路径过滤，如 /read/"
              style={{ width: 220 }}
              onSearch={(value) => setParams((prev) => ({ ...prev, path: value || undefined, page: 1 }))}
            />
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={logsData?.list ?? []}
          loading={loadingLogs}
          scroll={{ x: 1200 }}
          pagination={{
            current: logsData?.page ?? 1,
            pageSize: logsData?.pageSize ?? 20,
            total: logsData?.total ?? 0,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => setParams((prev) => ({ ...prev, page, pageSize })),
          }}
        />
      </Card>
    </div>
  )
}
