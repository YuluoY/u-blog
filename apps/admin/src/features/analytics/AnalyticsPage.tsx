import { useState, useMemo } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Select,
  DatePicker,
  Input,
  Space,
  Tag,
  Spin,
  Tabs,
  Button,
  Popconfirm,
  App,
} from 'antd'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  EyeOutlined,
  UserOutlined,
  ClockCircleOutlined,
  UserAddOutlined,
  RiseOutlined,
  GlobalOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts'
import type { ColumnsType } from 'antd/es/table'
import {
  useOverview,
  useTrends,
  usePageRanks,
  useGeoDistribution,
  useDeviceStats,
  useActivityLogs,
} from './useAnalytics'
import { clearLogsByIp, type LogListParams } from './api'
import { exportToJSON } from '../../shared/utils/exportData'
import { WriteAction } from '../../shared/components/WriteAction'

const { RangePicker } = DatePicker

/** 事件类型中文映射 */
const TYPE_LABELS: Record<string, string> = {
  page_view: '页面浏览',
  article_view: '文章阅读',
  article_like: '文章点赞',
  article_share: '文章分享',
  search: '搜索',
  login: '登录',
  logout: '登出',
  register: '注册',
  comment: '评论',
  click: '点击',
}

/** 事件类型标签颜色 */
const TYPE_COLORS: Record<string, string> = {
  page_view: 'blue',
  article_view: 'cyan',
  article_like: 'magenta',
  article_share: 'green',
  search: 'orange',
  login: 'geekblue',
  logout: 'default',
  register: 'purple',
  comment: 'gold',
  click: 'lime',
}

function getTypeLabel(type: string): string {
  return TYPE_LABELS[type] || `未定义事件（${type}）`
}

/** 饼图颜色 */
const PIE_COLORS = ['#1677ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16', '#a0d911', '#2f54eb']

/** 格式化停留时长 */
function formatDuration(ms: number | null | undefined): string {
  if (!ms) return '-'
  if (ms < 1000) return `${ms}ms`
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m${s % 60}s`
}

export default function AnalyticsPage() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  const [days, setDays] = useState(30)
  const [logParams, setLogParams] = useState<LogListParams>({ page: 1, pageSize: 15 })
  const [clearIp, setClearIp] = useState('')

  const { data: overview, isLoading: loadingOverview } = useOverview()
  const { data: trends, isLoading: loadingTrends } = useTrends(days)
  const { data: pageRanks } = usePageRanks(20)
  const { data: geo } = useGeoDistribution(20)
  const { data: deviceStats } = useDeviceStats(10)
  const { data: logsData, isLoading: loadingLogs } = useActivityLogs(logParams)

  const clearByIp = useMutation({
    mutationFn: (ip: string) => clearLogsByIp(ip),
    onSuccess: (data, ip) => {
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
      message.success(`已清理 IP ${ip} 的 ${data.deleted} 条日志`)
      setClearIp('')
    },
    onError: (err: Error) => {
      message.error(err.message || '清理失败')
    },
  })

  /** 日志表列 */
  const logColumns: ColumnsType<any> = useMemo(() => [
    {
      title: '事件',
      dataIndex: 'type',
      width: 100,
      render: (t: string) => <Tag color={TYPE_COLORS[t] || 'default'}>{getTypeLabel(t)}</Tag>,
    },
    {
      title: '用户',
      dataIndex: 'user',
      width: 120,
      render: (u: any) => u ? <span>{u.namec || u.username}</span> : <Tag>游客</Tag>,
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      width: 130,
      ellipsis: true,
    },
    {
      title: '地理位置',
      dataIndex: 'location',
      width: 150,
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: '页面路径',
      dataIndex: 'path',
      ellipsis: true,
      width: 200,
    },
    {
      title: '浏览器',
      dataIndex: 'browser',
      width: 120,
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: '设备',
      dataIndex: 'device',
      width: 80,
      render: (v: string) => v || '-',
    },
    {
      title: 'OS',
      dataIndex: 'os',
      width: 100,
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: '停留',
      dataIndex: 'duration',
      width: 80,
      render: (v: number | null) => formatDuration(v),
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 170,
      render: (v: string) => v ? new Date(v).toLocaleString('zh-CN') : '-',
    },
  ], [])

  /** 页面排行列 */
  const pageColumns: ColumnsType<any> = useMemo(() => [
    { title: '排名', key: 'rank', width: 60, render: (_: any, __: any, i: number) => i + 1 },
    { title: '页面路径', dataIndex: 'path', ellipsis: true },
    { title: 'PV', dataIndex: 'pv', width: 80, sorter: (a: any, b: any) => a.pv - b.pv },
    { title: 'UV', dataIndex: 'uv', width: 80 },
    { title: '平均停留', dataIndex: 'avgDuration', width: 100, render: (v: number) => formatDuration(v) },
  ], [])

  /** 地域表列 */
  const geoColumns: ColumnsType<any> = useMemo(() => [
    { title: '排名', key: 'rank', width: 60, render: (_: any, __: any, i: number) => i + 1 },
    { title: '地区', dataIndex: 'location' },
    { title: '访问量', dataIndex: 'count', width: 100 },
  ], [])

  /** 当前可选的事件类型 */
  const typeOptions = useMemo(() => Object.entries(TYPE_LABELS)
    .map(([key, label]) => ({ label: `${label} (${key})`, value: key })), [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ---- 概览卡片 ---- */}
      <Spin spinning={loadingOverview}>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} lg={4}>
            <Card size="small" hoverable>
              <Statistic title="今日 PV" value={overview?.todayPv ?? 0} prefix={<EyeOutlined />} />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card size="small" hoverable>
              <Statistic title="今日 UV" value={overview?.todayUv ?? 0} prefix={<UserOutlined />} />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card size="small" hoverable>
              <Statistic title="总 PV" value={overview?.totalPv ?? 0} prefix={<RiseOutlined />} />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card size="small" hoverable>
              <Statistic title="总 UV" value={overview?.totalUv ?? 0} prefix={<GlobalOutlined />} />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card size="small" hoverable>
              <Statistic title="今日新用户" value={overview?.todayNewUsers ?? 0} prefix={<UserAddOutlined />} />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card size="small" hoverable>
              <Statistic title="平均停留" value={formatDuration(overview?.avgDuration)} prefix={<ClockCircleOutlined />} />
            </Card>
          </Col>
        </Row>
      </Spin>

      {/* ---- PV/UV 趋势图 ---- */}
      <Card
        title="访问趋势"
        extra={
          <Select value={days} onChange={setDays} style={{ width: 120 }} size="small" options={[
            { label: '近 7 天', value: 7 },
            { label: '近 30 天', value: 30 },
            { label: '近 90 天', value: 90 },
          ]} />
        }
      >
        <Spin spinning={loadingTrends}>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={trends ?? []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <ReTooltip />
              <Legend />
              <Line type="monotone" dataKey="pv" stroke="#1677ff" name="PV" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="uv" stroke="#52c41a" name="UV" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Spin>
      </Card>

      {/* ---- 分布统计（Tab 分组） ---- */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="页面排行 Top 20" extra={<WriteAction><Button size="small" icon={<DownloadOutlined />} onClick={() => exportToJSON(pageRanks ?? [], 'page-ranks')}>导出</Button></WriteAction>}>
            <Table
              dataSource={pageRanks ?? []}
              columns={pageColumns}
              rowKey="path"
              size="small"
              pagination={false}
              scroll={{ y: 400 }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="设备与浏览器分布">
            <Tabs
              size="small"
              items={[
                {
                  key: 'device',
                  label: '设备类型',
                  children: (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={deviceStats?.devices ?? []}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {(deviceStats?.devices ?? []).map((_: any, i: number) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <ReTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ),
                },
                {
                  key: 'browser',
                  label: '浏览器',
                  children: (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={deviceStats?.browsers ?? []} layout="vertical" margin={{ left: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                        <ReTooltip />
                        <Bar dataKey="count" fill="#1677ff" name="访问量" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ),
                },
                {
                  key: 'os',
                  label: '操作系统',
                  children: (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={deviceStats?.os ?? []}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {(deviceStats?.os ?? []).map((_: any, i: number) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <ReTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* ---- 地域分布 ---- */}
      <Card title="地域分布 Top 20" extra={<WriteAction><Button size="small" icon={<DownloadOutlined />} onClick={() => exportToJSON(geo ?? [], 'geo-distribution')}>导出</Button></WriteAction>}>
        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={geo ?? []} layout="vertical" margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="location" tick={{ fontSize: 12 }} width={120} />
                <ReTooltip />
                <Bar dataKey="count" fill="#722ed1" name="访问量" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Col>
          <Col xs={24} lg={12}>
            <Table
              dataSource={geo ?? []}
              columns={geoColumns}
              rowKey="location"
              size="small"
              pagination={false}
              scroll={{ y: 300 }}
            />
          </Col>
        </Row>
      </Card>

      {/* ---- 行为日志明细 ---- */}
      <Card title="行为日志明细" extra={<WriteAction><Button size="small" icon={<DownloadOutlined />} onClick={() => exportToJSON(logsData?.list ?? [], 'activity-logs')}>导出</Button></WriteAction>}>
        <Space wrap style={{ marginBottom: 16 }}>
          <Select
            placeholder="事件类型"
            allowClear
            style={{ width: 130 }}
            options={typeOptions}
            value={logParams.type || undefined}
            onChange={(v) => setLogParams((p) => ({
              ...p,
              type: v || undefined,
              page: 1,
            }))}
          />
          <Input.Search
            placeholder="IP 搜索"
            allowClear
            style={{ width: 160 }}
            onSearch={(v) => setLogParams((p) => ({ ...p, ip: v || undefined, page: 1 }))}
          />
          <Input.Search
            placeholder="路径搜索"
            allowClear
            style={{ width: 200 }}
            onSearch={(v) => setLogParams((p) => ({ ...p, path: v || undefined, page: 1 }))}
          />
          <Input
            placeholder="待清理 IP"
            allowClear
            style={{ width: 160 }}
            value={clearIp}
            onChange={(e) => setClearIp(e.target.value)}
          />
          <WriteAction>
            <Popconfirm
              title="确认清理该 IP 的行为访问日志？"
              description={clearIp ? `IP: ${clearIp}` : '请先输入 IP'}
              okText="确认"
              cancelText="取消"
              disabled={!clearIp.trim()}
              onConfirm={() => clearByIp.mutate(clearIp.trim())}
            >
              <Button danger loading={clearByIp.isPending} disabled={!clearIp.trim()}>
                按 IP 清理日志
              </Button>
            </Popconfirm>
          </WriteAction>
          <RangePicker
            size="middle"
            onChange={(_, [s, e]) => setLogParams((p) => ({
              ...p,
              startDate: s || undefined,
              endDate: e || undefined,
              page: 1,
            }))}
          />
        </Space>
        <Table
          dataSource={logsData?.list ?? []}
          columns={logColumns}
          rowKey="id"
          size="small"
          loading={loadingLogs}
          scroll={{ x: 1400 }}
          pagination={{
            current: logsData?.page ?? 1,
            pageSize: logsData?.pageSize ?? 15,
            total: logsData?.total ?? 0,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page, pageSize) => setLogParams((p) => ({ ...p, page, pageSize })),
          }}
        />
      </Card>
    </div>
  )
}
