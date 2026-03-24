#!/usr/bin/env bash
# =====================================================================
# u-blog 一键部署向导
# 用法: bash setup.sh
#
# 功能：
#   1. 自动检测并安装 Docker、Docker Compose、Node.js
#   2. 启动 Web 配置向导，引导完成部署
#
# 支持系统：Ubuntu/Debian、CentOS/RHEL/Fedora、Alpine、macOS
# =====================================================================
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ---- 辅助函数 ----
info()  { echo -e "  ${GREEN}✓${NC} $*"; }
warn()  { echo -e "  ${YELLOW}!${NC} $*"; }
fail()  { echo -e "  ${RED}✗${NC} $*"; }
step()  { echo -e "\n  ${CYAN}${BOLD}[$1/3]${NC} ${BOLD}$2${NC}"; }
run_visible() {
  # 执行命令并实时显示输出（带缩进）
  echo -e "  ${DIM}$ $*${NC}"
  "$@" 2>&1 | sed 's/^/    /' || return $?
}

# ---- 系统检测 ----
detect_os() {
  if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS_ID="${ID:-unknown}"
    OS_LIKE="${ID_LIKE:-$OS_ID}"
  elif [ "$(uname)" = "Darwin" ]; then
    OS_ID="macos"
    OS_LIKE="macos"
  else
    OS_ID="unknown"
    OS_LIKE="unknown"
  fi
}

need_sudo() {
  if [ "$(id -u)" -ne 0 ]; then
    if command -v sudo &>/dev/null; then
      echo "sudo"
    else
      fail "需要 root 权限，请使用 sudo bash setup.sh 运行"
      exit 1
    fi
  else
    echo ""
  fi
}

# =====================================================================
#  安装函数
# =====================================================================

install_docker() {
  local SUDO
  SUDO=$(need_sudo)

  echo ""
  echo -e "  ${CYAN}正在安装 Docker...${NC}"
  echo -e "  ${DIM}（使用 Docker 官方安装脚本）${NC}"
  echo ""

  if [[ "$OS_ID" == "macos" ]]; then
    fail "macOS 请手动安装 Docker Desktop: https://docs.docker.com/desktop/mac/install/"
    exit 1
  fi

  # 使用官方安装脚本（支持几乎所有 Linux 发行版）
  curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
  $SUDO sh /tmp/get-docker.sh 2>&1 | sed 's/^/    /'

  # 启动 Docker 服务
  if command -v systemctl &>/dev/null; then
    $SUDO systemctl start docker 2>/dev/null || true
    $SUDO systemctl enable docker 2>/dev/null || true
  fi

  # 将当前用户加入 docker 组（非 root 时）
  if [ "$(id -u)" -ne 0 ] && command -v usermod &>/dev/null; then
    $SUDO usermod -aG docker "$USER" 2>/dev/null || true
    warn "已将您加入 docker 用户组，当前会话已生效"
    # 让当前 shell 能用 docker（不需要重新登录）
    $SUDO chmod 666 /var/run/docker.sock 2>/dev/null || true
  fi

  echo ""

  # 等待 Docker daemon 启动
  local retries=0
  while ! docker info &>/dev/null && [ $retries -lt 30 ]; do
    sleep 1
    retries=$((retries + 1))
  done

  if docker info &>/dev/null; then
    local ver
    ver=$(docker version --format '{{.Server.Version}}' 2>/dev/null || echo "已安装")
    info "Docker ${ver} 安装成功"
  else
    fail "Docker 安装后无法启动，请检查系统日志"
    exit 1
  fi
}

install_node() {
  local SUDO
  SUDO=$(need_sudo)

  echo ""
  echo -e "  ${CYAN}正在安装 Node.js 20 LTS...${NC}"
  echo ""

  if [[ "$OS_ID" == "macos" ]]; then
    if command -v brew &>/dev/null; then
      run_visible brew install node@20
      info "Node.js $(node -v) 安装成功"
      return
    fi
    fail "macOS 请先安装 Homebrew: https://brew.sh"
    exit 1
  fi

  # Linux：使用 NodeSource 官方脚本
  if [[ "$OS_LIKE" == *"debian"* ]] || [[ "$OS_ID" == "ubuntu" ]] || [[ "$OS_ID" == "debian" ]]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x -o /tmp/nodesource_setup.sh
    $SUDO bash /tmp/nodesource_setup.sh 2>&1 | sed 's/^/    /'
    $SUDO apt-get install -y nodejs 2>&1 | sed 's/^/    /'
  elif [[ "$OS_LIKE" == *"rhel"* ]] || [[ "$OS_LIKE" == *"fedora"* ]] || [[ "$OS_ID" == "centos" ]] || [[ "$OS_ID" == "fedora" ]] || [[ "$OS_ID" == "rhel" ]]; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x -o /tmp/nodesource_setup.sh
    $SUDO bash /tmp/nodesource_setup.sh 2>&1 | sed 's/^/    /'
    $SUDO yum install -y nodejs 2>&1 | sed 's/^/    /' || $SUDO dnf install -y nodejs 2>&1 | sed 's/^/    /'
  elif [[ "$OS_ID" == "alpine" ]]; then
    $SUDO apk add --no-cache nodejs npm 2>&1 | sed 's/^/    /'
  else
    warn "未识别的 Linux 发行版 ($OS_ID)，尝试使用 NodeSource..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO bash - 2>&1 | sed 's/^/    /'
    $SUDO apt-get install -y nodejs 2>&1 | sed 's/^/    /' || $SUDO yum install -y nodejs 2>&1 | sed 's/^/    /'
  fi

  echo ""
  if command -v node &>/dev/null; then
    info "Node.js $(node -v) 安装成功"
  else
    fail "Node.js 安装失败，请手动安装: https://nodejs.org/"
    exit 1
  fi
}

# =====================================================================
#  主流程
# =====================================================================

echo ""
echo -e "${CYAN}  ╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}  ║${BOLD}          🚀 u-blog 一键部署向导              ${NC}${CYAN}║${NC}"
echo -e "${CYAN}  ╚══════════════════════════════════════════════╝${NC}"

detect_os
echo -e "  ${DIM}系统: ${OS_ID} | 项目: ${PROJECT_DIR}${NC}"

# ====== Step 1: 检测 & 安装 Docker ======
step 1 "检测 Docker 环境"

NEED_DOCKER=false
NEED_COMPOSE=false

if command -v docker &>/dev/null && docker info &>/dev/null 2>&1; then
  DOCKER_VER=$(docker version --format '{{.Server.Version}}' 2>/dev/null || echo "未知")
  info "Docker ${DOCKER_VER}"
else
  if command -v docker &>/dev/null; then
    warn "Docker 已安装但未运行"
    # 尝试启动
    if command -v systemctl &>/dev/null; then
      SUDO_CMD=$(need_sudo)
      $SUDO_CMD systemctl start docker 2>/dev/null || true
      sleep 2
    fi
    if docker info &>/dev/null 2>&1; then
      info "Docker 已启动"
    else
      NEED_DOCKER=true
    fi
  else
    NEED_DOCKER=true
  fi
fi

if $NEED_DOCKER; then
  warn "Docker 未安装"
  echo -e "  ${YELLOW}是否自动安装 Docker？${NC}"
  echo -ne "  ${BOLD}[Y/n]: ${NC}"
  read -r answer </dev/tty || answer="y"
  answer="${answer:-y}"
  if [[ "$answer" =~ ^[Yy]$ ]] || [[ -z "$answer" ]]; then
    install_docker
  else
    fail "Docker 是必须的，无法继续"
    exit 1
  fi
fi

# Docker Compose（Docker >= 20 自带 compose 子命令）
if docker compose version &>/dev/null 2>&1; then
  COMPOSE_VER=$(docker compose version --short 2>/dev/null || echo "未知")
  info "Docker Compose ${COMPOSE_VER}"
else
  warn "Docker Compose 未找到，正在安装..."
  SUDO_CMD=$(need_sudo)
  # 安装 compose 插件
  COMPOSE_URL="https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)"
  $SUDO_CMD mkdir -p /usr/local/lib/docker/cli-plugins
  $SUDO_CMD curl -SL "$COMPOSE_URL" -o /usr/local/lib/docker/cli-plugins/docker-compose 2>&1 | sed 's/^/    /'
  $SUDO_CMD chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
  if docker compose version &>/dev/null 2>&1; then
    info "Docker Compose $(docker compose version --short) 安装成功"
  else
    fail "Docker Compose 安装失败"
    exit 1
  fi
fi

# ====== Step 2: 检测 & 安装 Node.js ======
step 2 "检测 Node.js 环境"

USE_DOCKER_NODE=false

if command -v node &>/dev/null; then
  NODE_VER=$(node -v 2>/dev/null || echo "v0")
  NODE_MAJOR=$(echo "$NODE_VER" | sed 's/v//' | cut -d. -f1)
  if [ "${NODE_MAJOR}" -ge 18 ] 2>/dev/null; then
    info "Node.js ${NODE_VER}"
  else
    warn "Node.js ${NODE_VER} 版本过低（需要 >= 18）"
    echo -e "  ${YELLOW}选择安装方式:${NC}"
    echo -e "    ${BOLD}1)${NC} 自动安装 Node.js 20 LTS（推荐）"
    echo -e "    ${BOLD}2)${NC} 通过 Docker 临时运行（无需安装）"
    echo -ne "  ${BOLD}[1/2]: ${NC}"
    read -r choice </dev/tty || choice="1"
    choice="${choice:-1}"
    if [[ "$choice" == "2" ]]; then
      USE_DOCKER_NODE=true
    else
      install_node
    fi
  fi
else
  warn "Node.js 未安装"
  echo -e "  ${YELLOW}选择安装方式:${NC}"
  echo -e "    ${BOLD}1)${NC} 自动安装 Node.js 20 LTS（推荐，约 30 秒）"
  echo -e "    ${BOLD}2)${NC} 通过 Docker 临时运行（无需安装，稍慢）"
  echo -ne "  ${BOLD}[1/2]: ${NC}"
  read -r choice </dev/tty || choice="1"
  choice="${choice:-1}"
  if [[ "$choice" == "2" ]]; then
    USE_DOCKER_NODE=true
  else
    install_node
  fi
fi

# ====== Step 3: 启动向导 ======
step 3 "启动部署向导"
echo ""

if $USE_DOCKER_NODE; then
  info "通过 Docker 启动向导..."
  echo ""
  docker run --rm -it \
    --network host \
    -v "${PROJECT_DIR}":/app:rw \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -e HOST_PROJECT_DIR="${PROJECT_DIR}" \
    node:20-alpine \
    sh -c 'apk add --no-cache docker-cli docker-cli-compose >/dev/null 2>&1; cd /app && node scripts/setup.js --host --docker-mode'
else
  cd "${PROJECT_DIR}"
  exec node scripts/setup.js --host
fi
