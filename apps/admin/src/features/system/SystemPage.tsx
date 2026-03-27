/**
 * 系统管理页面
 * 包含：系统指标监控、Redis 管理、Nginx 状态、PM2 进程管理、数据计数维护、备份导出
 */
import { useState, useEffect, useCallback } from 'react'
import {
  Card, Row, Col, Statistic, Progress, Button, Space, Tag,
  Select, Descriptions, App, Spin, Typography, Popconfirm, Table,
  Drawer, Tooltip, Alert,
} from 'antd'
import {
  ReloadOutlined, DashboardOutlined,
  DatabaseOutlined, ContainerOutlined,
  CheckCircleOutlined, CloseCircleOutlined,
  SyncOutlined,
  FileTextOutlined, HddOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { ColumnsType } from 'antd/es/table'
import {
  fetchMetrics, fetchRedisInfo,
  flushRedis, fetchPm2List, restartBackend, fetchPm2Logs,
  fetchDataCounterAudit, repairDataCounters,
  fetchBackups, createBackup, downloadBackup,
  type SystemMetrics, type RedisInfo, type Pm2Process,
  type DataCounterAudit, type BackupArtifact,
  type DataCounterArticleDrift, type DataCounterCommentDrift,
} from './api'

const { Title, Text } = Typography

/** 字节格式化 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

/** 秒数格式化为可读时间 */
function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}天 ${h}小时 ${m}分钟`
  if (h > 0) return `${h}小时 ${m}分钟`
  return `${m}分钟`
}

/** 使用率对应的颜色 */
function usageColor(pct: number): string {
  if (pct < 60) return '#52c41a'
  if (pct < 80) return '#faad14'
  return '#ff4d4f'
}

/** 从未知异常中提取可展示错误信息。 */
function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message
  return fallback
}

/**
 * 渲染“数据库冗余计数”和“真实明细计数”的一致性状态。
 *
 * 这里刻意把两组数并列展示，方便管理员快速判断是显示层误差，
 * 还是数据库中的冗余字段已经产生漂移。
 */
function renderConsistency(stored: number, actual: number) {
  const consistent = stored === actual
  return (
    <Space size={8} wrap>
      <Text>{stored}</Text>
      <Text type="secondary">/ 实际 {actual}</Text>
      <Tag color={consistent ? 'success' : 'error'}>
        {consistent ? '一致' : '漂移'}
      </Tag>
    </Space>
  )
}

export default function SystemPage() {
  const { t } = useTranslation()
  const { message } = App.useApp()

  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [redisInfo, setRedisInfo] = useState<RedisInfo | null>(null)
  const [pm2Processes, setPm2Processes] = useState<Pm2Process[]>([])
  const [counterAudit, setCounterAudit] = useState<DataCounterAudit | null>(null)
  const [backups, setBackups] = useState<BackupArtifact[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  /** 自动刷新间隔（秒），0 表示关闭 */
  const [refreshInterval, setRefreshInterval] = useState<number>(30)
  /** 日志抽屉 */
  const [logsDrawer, setLogsDrawer] = useState<{ open: boolean; name: string; logs: string; loading: boolean }>({
    open: false, name: '', logs: '', loading: false,
  })

  /** 刷新所有数据 */
  const refreshAll = useCallback(async () => {
    setLoading(true)
    try {
      const [m, r, pm2, audit, backupList] = await Promise.all([
        fetchMetrics().catch(() => null),
        fetchRedisInfo().catch(() => null),
        fetchPm2List().catch(() => []),
        fetchDataCounterAudit().catch(() => null),
        fetchBackups().catch(() => []),
      ])
      setMetrics(m)
      setRedisInfo(r)
      setPm2Processes(pm2)
      setCounterAudit(audit)
      setBackups(backupList)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refreshAll() }, [refreshAll])

  // 自动刷新（可配置间隔）
  useEffect(() => {
    if (refreshInterval <= 0) return
    const timer = setInterval(refreshAll, refreshInterval * 1000)
    return () => clearInterval(timer)
  }, [refreshAll, refreshInterval])

  /** 操作执行器 */
  const handleAction = async (key: string, action: () => Promise<unknown>, successMsg: string) => {
    setActionLoading(key)
    try {
      await action()
      message.success(successMsg)
      refreshAll()
    } catch (error: unknown) {
      message.error(getErrorMessage(error, '操作失败'))
    } finally {
      setActionLoading(null)
    }
  }

  /** PM2 进程状态颜色 */
  const pm2StatusColor = (status: string) => {
    if (status === 'online') return 'success'
    if (status === 'launching') return 'processing'
    return 'error'
  }

  /** 查看 PM2 进程日志 */
  const openPm2Logs = async (name: string) => {
    setLogsDrawer({ open: true, name, logs: '', loading: true })
    try {
      const logs = await fetchPm2Logs(name, 200)
      setLogsDrawer(prev => ({ ...prev, logs, loading: false }))
    } catch (error: unknown) {
      setLogsDrawer(prev => ({ ...prev, logs: getErrorMessage(error, '获取日志失败'), loading: false }))
    }
  }

  /**
   * 单独刷新计数审计结果，避免普通资源刷新失败时遮挡数据维护链路。
   */
  const refreshCounterAudit = async () => {
    setActionLoading('counter-audit')
    try {
      const audit = await fetchDataCounterAudit()
      setCounterAudit(audit)
      message.success('计数审计已刷新')
    } catch (error: unknown) {
      message.error(getErrorMessage(error, '刷新计数审计失败'))
    } finally {
      setActionLoading(null)
    }
  }

  /**
   * 手动修复文章点赞、文章评论、评论点赞的冗余计数。
   */
  const handleRepairCounters = async () => {
    setActionLoading('counter-repair')
    try {
      const result = await repairDataCounters()
      setCounterAudit(result.audit)
      message.success(
        `计数修复完成：文章点赞 ${result.repairedArticleLikeRows} 条，文章评论 ${result.repairedArticleCommentRows} 条，评论点赞 ${result.repairedCommentLikeRows} 条`,
      )
    } catch (error: unknown) {
      message.error(getErrorMessage(error, '计数修复失败'))
    } finally {
      setActionLoading(null)
    }
  }

  /**
   * 创建完整博客备份，并立即刷新备份列表。
   */
  const handleCreateBackup = async () => {
    setActionLoading('backup-create')
    try {
      const artifact = await createBackup()
      message.success(`备份已创建：${artifact.name}`)
      const backupList = await fetchBackups()
      setBackups(backupList)
    } catch (error: unknown) {
      message.error(getErrorMessage(error, '创建备份失败'))
    } finally {
      setActionLoading(null)
    }
  }

  /**
   * 下载指定备份归档。
   * 这里直接复用现有 file-saver，避免在页面内手写浏览器下载细节。
   */
  const handleDownloadBackup = async (name: string) => {
    setActionLoading(`backup-download-${name}`)
    try {
      const blob = await downloadBackup(name)
      const { saveAs } = await import('file-saver')
      saveAs(blob, name)
      message.success(`备份 ${name} 已开始下载`)
    } catch (error: unknown) {
      message.error(getErrorMessage(error, '下载备份失败'))
    } finally {
      setActionLoading(null)
    }
  }

  /** PM2 进程表格列 */
  const pm2Columns: ColumnsType<Pm2Process> = [
    {
      title: '进程',
      dataIndex: 'name',
      width: 140,
      ellipsis: true,
      render: (name: string, r) => (
        <Space size={4}>
          <Text strong>{name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>#{r.pm_id}</Text>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      align: 'center',
      render: (status: string) => (
        <Tag
          icon={status === 'online' ? <CheckCircleOutlined /> : status === 'launching' ? <SyncOutlined spin /> : <CloseCircleOutlined />}
          color={pm2StatusColor(status)}
        >
          {status}
        </Tag>
      ),
    },
    {
      title: 'CPU',
      dataIndex: 'cpu',
      width: 60,
      align: 'right',
      render: (cpu: number) => `${cpu}%`,
    },
    {
      title: '内存',
      dataIndex: 'memory',
      width: 80,
      align: 'right',
      render: (mem: number) => formatBytes(mem),
    },
    {
      title: '运行',
      dataIndex: 'uptime',
      width: 80,
      ellipsis: true,
      render: (uptime: number) => uptime > 0 ? formatUptime(Math.floor(uptime / 1000)) : '-',
    },
    {
      title: '↺',
      dataIndex: 'restarts',
      width: 45,
      align: 'center',
      render: (restarts: number) => restarts > 0 ? <Tag color="warning">{restarts}</Tag> : <Text type="secondary">0</Text>,
    },
    {
      title: '操作',
      key: 'action',
      width: 70,
      align: 'center',
      render: (_: unknown, r: Pm2Process) => (
        <Space size={4}>
          <Popconfirm title={`确认重启 ${r.name}？`} onConfirm={() => handleAction(`pm2-restart`, () => restartBackend(), `${r.name} 已重启`)}>
            <Tooltip title="重启"><Button size="small" type="text" icon={<ReloadOutlined />} loading={actionLoading === 'pm2-restart'} /></Tooltip>
          </Popconfirm>
          <Tooltip title="日志">
            <Button size="small" type="text" icon={<FileTextOutlined />} onClick={() => openPm2Logs(r.name)} />
          </Tooltip>
        </Space>
      ),
    },
  ]

  /** 文章计数漂移表 */
  const articleDriftColumns: ColumnsType<DataCounterArticleDrift> = [
    {
      title: '文章',
      dataIndex: 'title',
      ellipsis: true,
      render: (title: string, record) => <Text>{`#${record.id} ${title}`}</Text>,
    },
    {
      title: '点赞',
      key: 'likeCount',
      width: 180,
      render: (_: unknown, record) => renderConsistency(record.storedLikeCount, record.actualLikeCount),
    },
    {
      title: '评论',
      key: 'commentCount',
      width: 180,
      render: (_: unknown, record) => renderConsistency(record.storedCommentCount, record.actualCommentCount),
    },
  ]

  /** 评论点赞漂移表 */
  const commentDriftColumns: ColumnsType<DataCounterCommentDrift> = [
    {
      title: '评论 ID',
      dataIndex: 'id',
      width: 120,
      render: (id: number) => <Text code>{id}</Text>,
    },
    {
      title: '所属文章',
      dataIndex: 'articleId',
      width: 120,
      render: (articleId: number | null) => articleId == null ? <Text type="secondary">-</Text> : <Text code>{articleId}</Text>,
    },
    {
      title: '点赞',
      key: 'likeCount',
      render: (_: unknown, record) => renderConsistency(record.storedLikeCount, record.actualLikeCount),
    },
  ]

  /** 备份归档列表 */
  const backupColumns: ColumnsType<BackupArtifact> = [
    {
      title: '备份文件',
      dataIndex: 'name',
      ellipsis: true,
      render: (name: string) => <Text code>{name}</Text>,
    },
    {
      title: '内容',
      key: 'content',
      width: 220,
      render: (_: unknown, record) => (
        <Space size={[4, 4]} wrap>
          <Tag color="blue">{record.tableCount} 张表</Tag>
          <Tag color="cyan">{record.totalRows} 行</Tag>
          {record.includesUploads ? <Tag color="green">uploads</Tag> : null}
          {record.includesStatic ? <Tag color="gold">static</Tag> : null}
        </Space>
      ),
    },
    {
      title: '大小',
      dataIndex: 'size',
      width: 110,
      align: 'right',
      sorter: (a, b) => a.size - b.size,
      render: (size: number) => formatBytes(size),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 170,
      render: (value: string) => new Date(value).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 90,
      align: 'center',
      render: (_: unknown, record) => (
        <Tooltip title="下载备份">
          <Button
            size="small"
            type="text"
            icon={<DownloadOutlined />}
            loading={actionLoading === `backup-download-${record.name}`}
            onClick={() => handleDownloadBackup(record.name)}
          />
        </Tooltip>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 顶部操作栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>
          <DashboardOutlined style={{ marginRight: 8 }} />
          {t('menu.system')}
        </Title>
        <Space>
          {/* 自动刷新间隔选择 */}
          <Select
            size="small"
            value={refreshInterval}
            onChange={setRefreshInterval}
            style={{ width: 130 }}
            options={[
              { value: 0, label: '关闭自动刷新' },
              { value: 5, label: '每 5 秒' },
              { value: 10, label: '每 10 秒' },
              { value: 15, label: '每 15 秒' },
              { value: 30, label: '每 30 秒' },
              { value: 60, label: '每 60 秒' },
            ]}
          />
          <Button size="small" icon={<ReloadOutlined />} onClick={refreshAll} loading={loading}>
            {t('common.refresh') || '刷新'}
          </Button>
        </Space>
      </div>

      {loading && !metrics ? (
        <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />
      ) : (
        <>
          {/* ===== 系统指标 ===== */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card size="small">
                <Statistic title="CPU 使用率" value={metrics?.cpuUsage ?? 0} suffix="%" />
                <Progress percent={metrics?.cpuUsage ?? 0} strokeColor={usageColor(metrics?.cpuUsage ?? 0)} showInfo={false} size="small" />
                <Text type="secondary" style={{ fontSize: 12 }}>{metrics?.cpuCores ?? 0} 核 · {metrics?.cpuModel?.slice(0, 30) ?? ''}</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card size="small">
                <Statistic title="内存" value={metrics?.memUsage ?? 0} suffix="%" />
                <Progress percent={metrics?.memUsage ?? 0} strokeColor={usageColor(metrics?.memUsage ?? 0)} showInfo={false} size="small" />
                <Text type="secondary" style={{ fontSize: 12 }}>{formatBytes(metrics?.memUsed ?? 0)} / {formatBytes(metrics?.memTotal ?? 0)}</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card size="small">
                <Statistic title="磁盘" value={metrics?.diskUsage ?? 0} suffix="%" />
                <Progress percent={metrics?.diskUsage ?? 0} strokeColor={usageColor(metrics?.diskUsage ?? 0)} showInfo={false} size="small" />
                <Text type="secondary" style={{ fontSize: 12 }}>{formatBytes(metrics?.diskUsed ?? 0)} / {formatBytes(metrics?.diskTotal ?? 0)}</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card size="small">
                <Statistic title="运行时间" value={formatUptime(metrics?.uptime ?? 0)} />
                <Text type="secondary" style={{ fontSize: 12 }}>负载: {metrics?.loadAvg?.join(' / ') ?? 'N/A'}</Text>
              </Card>
            </Col>
          </Row>

          {/* ===== 系统信息 ===== */}
          <Card size="small" title="系统信息">
            <Descriptions size="small" column={{ xs: 1, sm: 2, md: 3 }}>
              <Descriptions.Item label="操作系统">{metrics?.platform ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="主机名">{metrics?.hostname ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="Node.js">{metrics?.nodeVersion ?? '-'}</Descriptions.Item>
            </Descriptions>
          </Card>

          {/* ===== 服务管理 ===== */}
          <Row gutter={[16, 16]}>
            {/* Redis */}
            <Col xs={24} lg={12}>
              <Card
                size="small"
                title={<><DatabaseOutlined style={{ marginRight: 8 }} />Redis</>}
                extra={
                  <Popconfirm title="确认刷新所有缓存？" onConfirm={() => handleAction('redis', flushRedis, '缓存已清除')}>
                    <Button size="small" danger loading={actionLoading === 'redis'}>清除缓存</Button>
                  </Popconfirm>
                }
              >
                <Descriptions size="small" column={1}>
                  <Descriptions.Item label="状态">
                    {redisInfo?.connected
                      ? <Tag icon={<CheckCircleOutlined />} color="success">在线</Tag>
                      : <Tag icon={<CloseCircleOutlined />} color="error">离线</Tag>
                    }
                  </Descriptions.Item>
                  {redisInfo?.connected && <>
                    <Descriptions.Item label="版本">{redisInfo.version}</Descriptions.Item>
                    <Descriptions.Item label="内存">{redisInfo.usedMemory} / 峰值 {redisInfo.usedMemoryPeak}</Descriptions.Item>
                    <Descriptions.Item label="Key 数量">{redisInfo.totalKeys}</Descriptions.Item>
                    <Descriptions.Item label="命中率">{redisInfo.hitRate}</Descriptions.Item>
                    <Descriptions.Item label="客户端连接">{redisInfo.connectedClients}</Descriptions.Item>
                    <Descriptions.Item label="运行时间">{formatUptime(redisInfo.uptime ?? 0)}</Descriptions.Item>
                  </>}
                </Descriptions>
              </Card>
            </Col>

            {/* PM2 进程管理 */}
            <Col xs={24} lg={12}>
              <Card
                size="small"
                title={<><ContainerOutlined style={{ marginRight: 8 }} />PM2 进程</>}
              >
                <Table<Pm2Process>
                  rowKey="pm_id"
                  columns={pm2Columns}
                  dataSource={pm2Processes}
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
          </Row>

          {/* ===== 数据计数维护 / 备份导出 ===== */}
          <Row gutter={[16, 16]}>
            <Col xs={24} xl={14}>
              <Card
                size="small"
                title={<><DatabaseOutlined style={{ marginRight: 8 }} />数据计数维护</>}
                extra={
                  <Space>
                    <Button
                      size="small"
                      icon={<ReloadOutlined />}
                      loading={actionLoading === 'counter-audit'}
                      onClick={refreshCounterAudit}
                    >
                      刷新审计
                    </Button>
                    <Popconfirm
                      title="确认修复计数漂移？"
                      description="会按数据库真实明细重算文章点赞、文章评论、评论点赞计数。"
                      onConfirm={handleRepairCounters}
                    >
                      <Button
                        size="small"
                        type="primary"
                        loading={actionLoading === 'counter-repair'}
                      >
                        一键修复
                      </Button>
                    </Popconfirm>
                  </Space>
                }
              >
                <Alert
                  type={counterAudit && counterAudit.driftArticleCount === 0 && counterAudit.driftCommentCount === 0 ? 'success' : 'warning'}
                  showIcon
                  style={{ marginBottom: 16 }}
                  message={
                    counterAudit && counterAudit.driftArticleCount === 0 && counterAudit.driftCommentCount === 0
                      ? '当前文章/评论冗余计数字段与数据库明细一致'
                      : '检测到文章或评论的冗余计数字段存在漂移，可在确认后执行一键修复'
                  }
                  description={counterAudit?.articleViewCountNote}
                />

                <Descriptions size="small" column={{ xs: 1, md: 2 }}>
                  <Descriptions.Item label="网站总浏览">{counterAudit?.sitePageViews ?? 0}</Descriptions.Item>
                  <Descriptions.Item label="网站访客">{counterAudit?.siteUniqueVisitors ?? 0}</Descriptions.Item>
                  <Descriptions.Item label="网站总点赞">{counterAudit?.siteLikeTotal ?? 0}</Descriptions.Item>
                  <Descriptions.Item label="网站评论（可见）">{counterAudit?.siteCommentVisibleTotal ?? 0}</Descriptions.Item>
                  <Descriptions.Item label="独立页面评论">{counterAudit?.siteStandaloneCommentVisibleTotal ?? 0}</Descriptions.Item>
                  <Descriptions.Item label="已删除评论">{counterAudit?.siteDeletedCommentTotal ?? 0}</Descriptions.Item>
                  <Descriptions.Item label="文章点赞冗余校验">{counterAudit ? renderConsistency(counterAudit.articleLikeStoredTotal, counterAudit.articleLikeActualTotal) : '-'}</Descriptions.Item>
                  <Descriptions.Item label="文章评论冗余校验">{counterAudit ? renderConsistency(counterAudit.articleCommentStoredTotal, counterAudit.articleCommentActualTotal) : '-'}</Descriptions.Item>
                  <Descriptions.Item label="评论点赞冗余校验">{counterAudit ? renderConsistency(counterAudit.commentLikeStoredTotal, counterAudit.commentLikeActualTotal) : '-'}</Descriptions.Item>
                  <Descriptions.Item label="漂移项">
                    <Space size={8}>
                      <Tag color={counterAudit?.driftArticleCount ? 'error' : 'success'}>文章 {counterAudit?.driftArticleCount ?? 0}</Tag>
                      <Tag color={counterAudit?.driftCommentCount ? 'error' : 'success'}>评论 {counterAudit?.driftCommentCount ?? 0}</Tag>
                    </Space>
                  </Descriptions.Item>
                </Descriptions>

                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <Text strong>文章计数漂移</Text>
                    <Table<DataCounterArticleDrift>
                      rowKey="id"
                      style={{ marginTop: 8 }}
                      columns={articleDriftColumns}
                      dataSource={counterAudit?.driftArticles ?? []}
                      pagination={false}
                      size="small"
                      locale={{ emptyText: '暂无文章计数漂移' }}
                    />
                  </div>

                  <div>
                    <Text strong>评论点赞漂移</Text>
                    <Table<DataCounterCommentDrift>
                      rowKey="id"
                      style={{ marginTop: 8 }}
                      columns={commentDriftColumns}
                      dataSource={counterAudit?.driftComments ?? []}
                      pagination={false}
                      size="small"
                      locale={{ emptyText: '暂无评论点赞漂移' }}
                    />
                  </div>
                </div>
              </Card>
            </Col>

            <Col xs={24} xl={10}>
              <Card
                size="small"
                title={<><HddOutlined style={{ marginRight: 8 }} />博客备份与导出</>}
                extra={
                  <Button
                    size="small"
                    type="primary"
                    icon={<DatabaseOutlined />}
                    loading={actionLoading === 'backup-create'}
                    onClick={handleCreateBackup}
                  >
                    创建备份
                  </Button>
                }
              >
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message="手动备份会导出数据库实体表数据，并打包 public/uploads 与 public/static。"
                  description="备份文件以 tar.gz 归档，可直接下载留存。"
                />

                <Table<BackupArtifact>
                  rowKey="name"
                  columns={backupColumns}
                  dataSource={backups}
                  pagination={false}
                  size="small"
                  scroll={{ y: 360 }}
                  locale={{ emptyText: '暂无备份文件' }}
                />
              </Card>
            </Col>
          </Row>

        </>
      )}

      {/* ===== PM2 日志抽屉 ===== */}
      <Drawer
        title={`PM2 日志 — ${logsDrawer.name}`}
        open={logsDrawer.open}
        onClose={() => setLogsDrawer(prev => ({ ...prev, open: false }))}
        width={720}
        extra={
          <Button size="small" icon={<ReloadOutlined />} loading={logsDrawer.loading}
            onClick={() => openPm2Logs(logsDrawer.name)}>
            刷新
          </Button>
        }
      >
        {logsDrawer.loading ? (
          <Spin style={{ display: 'block', margin: '40px auto' }} />
        ) : (
          <pre style={{
            backgroundColor: '#1e1e1e', color: '#d4d4d4', padding: 16, borderRadius: 8,
            fontSize: 12, lineHeight: 1.6, overflow: 'auto', maxHeight: 'calc(100vh - 160px)',
            whiteSpace: 'pre-wrap', wordBreak: 'break-all',
          }}>
            {logsDrawer.logs || '暂无日志'}
          </pre>
        )}
      </Drawer>
    </div>
  )
}
