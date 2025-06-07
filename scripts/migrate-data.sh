#!/bin/bash

# Mumble 数据迁移脚本
# 用于从旧服务器迁移数据到新的EC2实例

set -e

# 配置变量
OLD_SERVER_IP=""
NEW_SERVER_IP=""
SSH_KEY_PATH=""
BACKUP_DIR="/tmp/mumble-backup-$(date +%Y%m%d-%H%M%S)"

echo "🔄 Mumble 数据迁移工具"
echo "===================="

# 检查参数
if [ "$#" -lt 2 ]; then
    echo "使用方法: $0 <旧服务器IP> <新服务器IP> [SSH密钥路径]"
    echo ""
    echo "示例:"
    echo "  $0 1.2.3.4 5.6.7.8"
    echo "  $0 1.2.3.4 5.6.7.8 ~/.ssh/my-key.pem"
    exit 1
fi

OLD_SERVER_IP=$1
NEW_SERVER_IP=$2
SSH_KEY_PATH=${3:-"~/.ssh/id_rsa"}

echo "旧服务器: $OLD_SERVER_IP"
echo "新服务器: $NEW_SERVER_IP"
echo "SSH密钥: $SSH_KEY_PATH"
echo ""

# 创建备份目录
mkdir -p $BACKUP_DIR
echo "📁 创建备份目录: $BACKUP_DIR"

# 1. 备份MongoDB数据
echo "💾 备份MongoDB数据..."
ssh -i $SSH_KEY_PATH ec2-user@$OLD_SERVER_IP "mongodump --db mumble --out /tmp/mongodb-backup"
scp -i $SSH_KEY_PATH -r ec2-user@$OLD_SERVER_IP:/tmp/mongodb-backup $BACKUP_DIR/

# 2. 备份上传的文件
echo "📁 备份上传文件..."
ssh -i $SSH_KEY_PATH ec2-user@$OLD_SERVER_IP "tar -czf /tmp/uploads-backup.tar.gz -C /opt/mumble/src/backend uploads" || {
    echo "⚠️  上传文件备份失败，可能目录不存在"
}
scp -i $SSH_KEY_PATH ec2-user@$OLD_SERVER_IP:/tmp/uploads-backup.tar.gz $BACKUP_DIR/ 2>/dev/null || true

# 3. 备份环境配置
echo "⚙️  备份环境配置..."
scp -i $SSH_KEY_PATH ec2-user@$OLD_SERVER_IP:/opt/mumble/src/backend/.env $BACKUP_DIR/backend.env 2>/dev/null || {
    echo "⚠️  后端环境文件不存在"
}
scp -i $SSH_KEY_PATH ec2-user@$OLD_SERVER_IP:/opt/mumble/src/frontend/.env $BACKUP_DIR/frontend.env 2>/dev/null || {
    echo "⚠️  前端环境文件不存在"
}

# 4. 恢复到新服务器
echo "🔄 恢复数据到新服务器..."

# 恢复MongoDB数据
echo "💾 恢复MongoDB数据..."
scp -i $SSH_KEY_PATH -r $BACKUP_DIR/mongodb-backup ec2-user@$NEW_SERVER_IP:/tmp/
ssh -i $SSH_KEY_PATH ec2-user@$NEW_SERVER_IP "mongorestore --db mumble /tmp/mongodb-backup/mumble"

# 恢复上传文件
if [ -f "$BACKUP_DIR/uploads-backup.tar.gz" ]; then
    echo "📁 恢复上传文件..."
    scp -i $SSH_KEY_PATH $BACKUP_DIR/uploads-backup.tar.gz ec2-user@$NEW_SERVER_IP:/tmp/
    ssh -i $SSH_KEY_PATH ec2-user@$NEW_SERVER_IP "cd /opt/mumble/src/backend && tar -xzf /tmp/uploads-backup.tar.gz"
fi

# 恢复环境配置
if [ -f "$BACKUP_DIR/backend.env" ]; then
    echo "⚙️  恢复后端环境配置..."
    scp -i $SSH_KEY_PATH $BACKUP_DIR/backend.env ec2-user@$NEW_SERVER_IP:/opt/mumble/src/backend/.env
fi

if [ -f "$BACKUP_DIR/frontend.env" ]; then
    echo "⚙️  恢复前端环境配置..."
    # 更新前端API地址为新服务器IP
    sed "s/REACT_APP_API_BASE_URL=.*/REACT_APP_API_BASE_URL=http:\/\/$NEW_SERVER_IP:5000\/api\/v1/" $BACKUP_DIR/frontend.env > /tmp/frontend.env
    scp -i $SSH_KEY_PATH /tmp/frontend.env ec2-user@$NEW_SERVER_IP:/opt/mumble/src/frontend/.env
fi

# 5. 重启新服务器上的服务
echo "🔄 重启服务..."
ssh -i $SSH_KEY_PATH ec2-user@$NEW_SERVER_IP "cd /opt/mumble && pm2 restart all"

# 6. 验证迁移
echo "✅ 验证迁移结果..."
if ssh -i $SSH_KEY_PATH ec2-user@$NEW_SERVER_IP "curl -f http://localhost:5000/api/v1/health" > /dev/null 2>&1; then
    echo "✅ 新服务器API正常运行"
else
    echo "❌ 新服务器API异常，请检查日志"
fi

# 清理临时文件
echo "🧹 清理临时文件..."
ssh -i $SSH_KEY_PATH ec2-user@$OLD_SERVER_IP "rm -rf /tmp/mongodb-backup /tmp/uploads-backup.tar.gz" 2>/dev/null || true
ssh -i $SSH_KEY_PATH ec2-user@$NEW_SERVER_IP "rm -rf /tmp/mongodb-backup /tmp/uploads-backup.tar.gz /tmp/frontend.env" 2>/dev/null || true

echo ""
echo "🎉 数据迁移完成！"
echo ""
echo "📋 迁移摘要:"
echo "  备份位置: $BACKUP_DIR"
echo "  新服务器: http://$NEW_SERVER_IP"
echo "  API地址: http://$NEW_SERVER_IP:5000/api/v1/health"
echo ""
echo "🔧 后续步骤:"
echo "1. 测试新服务器功能"
echo "2. 更新DNS记录指向新服务器"
echo "3. 配置SSL证书"
echo "4. 关闭旧服务器"
