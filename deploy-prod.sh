# 部署脚本配置
REMOTE_USER="root"
REMOTE_HOST="115.190.202.146"
REMOTE_PATH="/opt/rag-knowledge-qa-web"
DOCKER_IMAGE_NAME="rag-knowledge-qa-web"
CONTAINER_NAME="rag-knowledge-qa-web-container"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

log "传输源代码到远程服务器进行构建..."
ssh ${REMOTE_USER}@${REMOTE_HOST} "mkdir -p ${REMOTE_PATH}"

# 传输所有必要文件（排除不必要的文件）
rsync -av --delete \
    --exclude node_modules \
    --exclude .git \
    --exclude '*.tar' \
    ./ $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/ || error "文件传输失败"

log "在远程服务器上构建和部署应用..."
ssh $REMOTE_USER@$REMOTE_HOST "
    set -e
    cd $REMOTE_PATH

    echo '=== 清理现有容器和镜像 ==='
    docker-compose down 2>/dev/null || true
    docker rm -f $CONTAINER_NAME 2>/dev/null || true
    docker rmi $DOCKER_IMAGE_NAME:latest 2>/dev/null || true

    echo '=== 检查文件是否存在 ==='
    ls -la

    echo '=== 在远程服务器上构建镜像 ==='
    docker build -t $DOCKER_IMAGE_NAME:latest .

    echo '=== 启动服务 ==='
    docker run -d \
        --name $CONTAINER_NAME \
        --network rag-knowledge-qa_rag-network \
        -p 3000:80 \
        $DOCKER_IMAGE_NAME:latest

    sleep 3

    echo '=== 检查容器状态 ==='
    docker ps | grep $CONTAINER_NAME

    echo '=== 检查服务是否正常 ==='
    curl -s http://localhost:3000 > /dev/null && echo '服务启动成功' || echo '服务启动检查失败'
" || error "远程部署失败"

log "前端应用部署完成!"
log "访问地址: http://$REMOTE_HOST:3000"
;;