#!/bin/bash
# Mumble生产环境部署脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查必要的工具
check_prerequisites() {
    log_info "检查部署前置条件..."
    
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform未安装，请先安装Terraform"
        exit 1
    fi
    
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI未安装，请先安装AWS CLI"
        exit 1
    fi
    
    # 检查AWS凭证
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS凭证未配置，请运行 'aws configure'"
        exit 1
    fi
    
    log_info "前置条件检查完成"
}

# 创建SSH密钥对
create_key_pair() {
    local key_name="mumble-keypair"
    
    if [ ! -f ~/.ssh/${key_name}.pem ]; then
        log_info "创建SSH密钥对..."
        aws ec2 create-key-pair --key-name ${key_name} --query 'KeyMaterial' --output text > ~/.ssh/${key_name}.pem
        chmod 400 ~/.ssh/${key_name}.pem
        log_info "SSH密钥对已创建: ~/.ssh/${key_name}.pem"
    else
        log_info "SSH密钥对已存在"
    fi
}

# 设置环境变量
setup_environment() {
    log_info "设置环境变量..."
    
    # 检查是否存在terraform.tfvars文件
    if [ ! -f infrastructure/terraform.tfvars ]; then
        log_warn "创建terraform.tfvars文件..."
        cat > infrastructure/terraform.tfvars << EOF
# AWS配置
aws_region = "us-east-1"
key_pair_name = "mumble-keypair"

# API密钥 (请替换为实际值)
openai_api_key = "your_openai_api_key_here"
openweather_api_key = "your_openweather_api_key_here"

# MongoDB Atlas配置 (请替换为实际值)
mongodb_atlas_public_key = "your_mongodb_atlas_public_key"
mongodb_atlas_private_key = "your_mongodb_atlas_private_key"

# 可选配置
domain_name = ""
ssl_certificate_arn = ""
EOF
        log_warn "请编辑 infrastructure/terraform.tfvars 文件，填入正确的API密钥"
        read -p "按Enter键继续..."
    fi
}

# 部署基础设施
deploy_infrastructure() {
    log_info "部署AWS基础设施..."
    
    cd infrastructure
    
    # 初始化Terraform
    terraform init
    
    # 验证配置
    terraform validate
    
    # 规划部署
    terraform plan -out=tfplan
    
    # 确认部署
    echo
    log_warn "即将部署以下资源到AWS，这将产生费用："
    echo "- EC2 t3.medium实例"
    echo "- EBS 20GB存储"
    echo "- S3存储桶"
    echo "- VPC和网络资源"
    echo "- 弹性IP"
    echo
    read -p "确认部署？(y/N): " confirm
    
    if [[ $confirm =~ ^[Yy]$ ]]; then
        terraform apply tfplan
        log_info "基础设施部署完成"
    else
        log_info "部署已取消"
        exit 0
    fi
    
    cd ..
}

# 配置MongoDB Atlas
setup_mongodb_atlas() {
    log_info "MongoDB Atlas配置说明："
    echo
    echo "请手动完成以下步骤："
    echo "1. 访问 https://cloud.mongodb.com/"
    echo "2. 创建新的项目和集群"
    echo "3. 选择M10专用集群 (生产环境推荐)"
    echo "4. 配置网络访问 - 添加EC2实例IP到白名单"
    echo "5. 创建数据库用户"
    echo "6. 获取连接字符串"
    echo
    log_warn "完成后，请更新EC2实例上的环境变量"
}

# 获取部署信息
get_deployment_info() {
    log_info "获取部署信息..."
    
    cd infrastructure
    
    INSTANCE_IP=$(terraform output -raw instance_public_ip)
    S3_BUCKET=$(terraform output -raw s3_bucket_name)
    
    echo
    log_info "部署完成！"
    echo "=================================="
    echo "实例公网IP: $INSTANCE_IP"
    echo "S3存储桶: $S3_BUCKET"
    echo "应用访问地址: http://$INSTANCE_IP"
    echo "SSH连接命令: ssh -i ~/.ssh/mumble-keypair.pem ec2-user@$INSTANCE_IP"
    echo "=================================="
    
    cd ..
}

# 配置应用环境变量
configure_application() {
    log_info "配置应用环境变量..."
    
    cd infrastructure
    INSTANCE_IP=$(terraform output -raw instance_public_ip)
    S3_BUCKET=$(terraform output -raw s3_bucket_name)
    cd ..
    
    # 创建远程配置脚本
    cat > /tmp/configure_app.sh << EOF
#!/bin/bash
# 更新应用环境变量

# 读取用户输入的API密钥
echo "请输入以下API密钥："
read -p "OpenAI API Key: " OPENAI_KEY
read -p "OpenWeatherMap API Key: " WEATHER_KEY
read -p "MongoDB Atlas连接字符串: " MONGODB_URI

# 更新环境变量文件
sudo tee /opt/mumble/.env > /dev/null << EOL
# Server Configuration
PORT=5000
NODE_ENV=production

# MongoDB Atlas Connection
MONGODB_URI=\$MONGODB_URI

# OpenAI API
OPENAI_API_KEY=\$OPENAI_KEY

# Weather API
OPENWEATHERMAP_API_KEY=\$WEATHER_KEY

# JWT Secret
JWT_SECRET=\$(openssl rand -base64 32)

# AWS S3 Configuration
AWS_REGION=us-east-1
S3_BUCKET_NAME=$S3_BUCKET
STORAGE_TYPE=s3

# Application URLs
FRONTEND_URL=http://$INSTANCE_IP:3000
BACKEND_URL=http://$INSTANCE_IP:5000
EOL

# 重启应用
cd /opt/mumble
pm2 restart mumble-backend
pm2 save

echo "应用配置已更新并重启"
EOF

    log_info "请SSH到服务器并运行配置脚本："
    echo "ssh -i ~/.ssh/mumble-keypair.pem ec2-user@$INSTANCE_IP"
    echo "bash /tmp/configure_app.sh"
}

# 主函数
main() {
    log_info "开始Mumble生产环境部署..."
    
    check_prerequisites
    create_key_pair
    setup_environment
    deploy_infrastructure
    get_deployment_info
    setup_mongodb_atlas
    configure_application
    
    log_info "部署脚本执行完成！"
    echo
    log_warn "后续步骤："
    echo "1. 配置MongoDB Atlas集群"
    echo "2. SSH到服务器配置API密钥"
    echo "3. 测试应用功能"
    echo "4. 配置域名和SSL证书（可选）"
}

# 执行主函数
main "$@"
