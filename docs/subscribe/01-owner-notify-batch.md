# 博主订阅批量通知

- **Version**: 1.0.0
- **Last Updated**: 2026-03-16
- **Code Paths**: `apps/backend/src/service/subscribe/owner-notifier.ts`, `apps/backend/src/service/subscribe/index.ts`

## 功能目的

当有新读者发起订阅时，将一段时间内的订阅汇总为一封邮件通知博主，避免每次订阅都发一封邮件。

## 工作原理

1. 用户提交订阅 → SubscribeService 完成订阅创建/验证邮件发送后，调用 `ownerNotifier.enqueue()`
2. 首条订阅入队时启动 **1 小时** 定时器
3. 窗口期内后续订阅仅入队，定时器不重置
4. 定时器到期 → 将队列中所有订阅汇总为一封邮件发送给博主

## 配置

| 环境变量 | 说明 | 默认值 |
|---------|------|-------|
| `OWNER_EMAIL` | 博主接收通知的邮箱 | 降级使用 `EMAIL_USER` |
| `EMAIL_USER` | QQ 邮箱发件账号 | 必填 |
| `EMAIL_PASS` | QQ 邮箱授权码 | 必填 |

## 关键约束

- **内存队列**：服务器重启会丢失未发送的队列数据（可接受，非关键通知）
- **窗口固定**：默认 1 小时，如需调整修改 `DEFAULT_WINDOW_MS` 常量
- **失败不重试**：邮件发送失败只记录日志，不回填队列

## Changelog

- `2026-03-16` **Feat**: 实现博主订阅批量通知功能（OwnerNotifier），1 小时窗口汇总
