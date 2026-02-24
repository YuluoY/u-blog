/**
 * 系统管理页面
 * 包含：系统指标监控、Redis/Nginx 管理、部署上传
 */
import { useState, useEffect, useCallback } from 'react'
import {
  Card, Row, Col, Statistic, Progress, Button, Space, Tag,
  Upload, Select, Descriptions, App, Spin, Typography, Popconfirm,
} from 'antd'
import {
  ReloadOutlined, CloudUploadOutlined, DashboardOutlined,
  DatabaseOutlined, CloudServerOutlined, RocketOutlined,
  CheckCircleOutlined, CloseCircleOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { UploadFile } from 'antd/es/upload/interface'
import {
  fetchMetrics, fetchRedisInfo, fetchNginxStatus, fetchPm2List,
  flushRedis, reloadNginx, restartBackend, deployUpload,
  type SystemMetrics, type RedisInfo, type NginxStatus,
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

export default function SystemPage() {
  const { t } = useTranslation()
  const { message } = App.useApp()

  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [redisInfo, setRedisInfo] = useState<RedisInfo | null>(null)
  const [nginxStatus, setNginxStatus] = useState<NginxStatus | null>(null)
  const [pm2List, setPm2List] = useState<any[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deployTarget, setDeployTarget] = useState<string>('frontend')
  const [deployFile, setDeployFile] = useState<UploadFile | null>(null)
  /** 自动刷新间隔（秒），0 表示关闭 */
  const [refreshInterval, setRefreshInterval] = useState<number>(30)

  /** 刷新所有数据 */
  const refreshAll = useCallback(async () => {
    setLoading(true)
    try {
      const [m, r, n, p] = await Promise.all([
        fetchMetrics().catch(() => null),
        fetchRedisInfo().catch(() => null),
        fetchNginxStatus().catch(() => null),
        fetchPm2List().catch(() => []),
      ])
      setMetrics(m)
      setRedisInfo(r)
      setNginxStatus(n)
      setPm2List(p)
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
  const handleAction = async (key: string, action: () => Promise<any>, successMsg: string) => {
    setActionLoading(key)
    try {
      await action()
      message.success(successMsg)
      refreshAll()
    } catch (e: any) {
      message.error(e.message || '操作失败')
    } finally {
      setActionLoading(null)
    }
  }

  /** 部署上传 */
  const handleDeploy = async () => {
    if (!deployFile?.originFileObj) {
      message.warning('请先选择部署文件')
      return
    }
    handleAction('deploy',
      () => deployUpload(deployFile.originFileObj!, deployTarget),
      `${deployTarget} 部署成功`
    )
  }

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
          <Button icon={<ReloadOutlined />} onClick={refreshAll} loading={loading}>
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
            <Col xs={24} lg={8}>
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

            {/* Nginx */}
            <Col xs={24} lg={8}>
              <Card
                size="small"
                title={<><CloudServerOutlined style={{ marginRight: 8 }} />Nginx</>}
                extra={
                  <Popconfirm title="确认重载 Nginx 配置？" onConfirm={() => handleAction('nginx', reloadNginx, 'Nginx 已重载')}>
                    <Button size="small" type="primary" loading={actionLoading === 'nginx'}>重载配置</Button>
                  </Popconfirm>
                }
              >
                <Descriptions size="small" column={1}>
                  <Descriptions.Item label="状态">
                    {nginxStatus?.running
                      ? <Tag icon={<CheckCircleOutlined />} color="success">运行中</Tag>
                      : <Tag icon={<CloseCircleOutlined />} color="error">已停止</Tag>
                    }
                  </Descriptions.Item>
                  {nginxStatus?.running && <>
                    <Descriptions.Item label="版本">{nginxStatus.version}</Descriptions.Item>
                    <Descriptions.Item label="Worker 进程">{nginxStatus.workerProcesses}</Descriptions.Item>
                  </>}
                </Descriptions>
              </Card>
            </Col>

            {/* PM2 后端进程 */}
            <Col xs={24} lg={8}>
              <Card
                size="small"
                title={<><RocketOutlined style={{ marginRight: 8 }} />后端服务</>}
                extra={
                  <Popconfirm title="确认重启后端服务？" onConfirm={() => handleAction('pm2', restartBackend, '后端服务已重启')}>
                    <Button size="small" type="primary" danger loading={actionLoading === 'pm2'}>重启</Button>
                  </Popconfirm>
                }
              >
                {pm2List.length > 0 ? pm2List.map((proc: any, i: number) => (
                  <Descriptions key={i} size="small" column={1}>
                    <Descriptions.Item label="进程名">{proc.name}</Descriptions.Item>
                    <Descriptions.Item label="状态">
                      <Tag color={proc.pm2_env?.status === 'online' ? 'success' : 'error'}>
                        {proc.pm2_env?.status ?? 'unknown'}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="PID">{proc.pid}</Descriptions.Item>
                    <Descriptions.Item label="内存">{formatBytes(proc.monit?.memory ?? 0)}</Descriptions.Item>
                    <Descriptions.Item label="CPU">{proc.monit?.cpu ?? 0}%</Descriptions.Item>
                    <Descriptions.Item label="重启次数">{proc.pm2_env?.restart_time ?? 0}</Descriptions.Item>
                  </Descriptions>
                )) : <Text type="secondary">无 PM2 进程</Text>}
              </Card>
            </Col>
          </Row>

          {/* ===== 部署上传 ===== */}
          <Card size="small" title={<><CloudUploadOutlined style={{ marginRight: 8 }} />手动部署</>}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space wrap>
                <Select
                  value={deployTarget}
                  onChange={setDeployTarget}
                  style={{ width: 160 }}
                  options={[
                    { value: 'frontend', label: '前端 (Frontend)' },
                    { value: 'admin', label: '后台 (Admin)' },
                  ]}
                />
                <Upload
                  maxCount={1}
                  accept=".zip,.tar.gz"
                  beforeUpload={(file) => { setDeployFile(file as any); return false }}
                  fileList={deployFile ? [deployFile] : []}
                  onRemove={() => setDeployFile(null)}
                >
                  <Button icon={<CloudUploadOutlined />}>选择 .zip / .tar.gz</Button>
                </Upload>
                <Popconfirm
                  title={`确认部署到 ${deployTarget}？`}
                  description="当前版本将被备份，新版本会替换部署目录"
                  onConfirm={handleDeploy}
                  disabled={!deployFile}
                >
                  <Button
                    type="primary"
                    loading={actionLoading === 'deploy'}
                    disabled={!deployFile}
                  >
                    开始部署
                  </Button>
                </Popconfirm>
              </Space>
              <Text type="secondary" style={{ fontSize: 12 }}>
                上传前端或后台的构建产物（dist 文件夹的 zip/tar.gz），将自动解压并部署到对应目录。当前版本会自动备份。
              </Text>
            </Space>
          </Card>
        </>
      )}
    </div>
  )
}
