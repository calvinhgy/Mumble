# Mumble EC2 迁移指南

本指南将帮助你将Mumble应用从当前环境迁移到新的t3.medium EC2实例。

## 🎯 迁移概览

- **源环境**: 当前EC2实例
- **目标环境**: t3.medium EC2实例
- **迁移内容**: 应用代码、数据库、上传文件、配置

## 📋 迁移前准备

### 1. 检查当前环境

```bash
# 检查当前项目状态
cd /home/ec2-user/hgy/Mumble
./start-dev.sh

# 检查数据库
mongo mumble --eval "db.stats()"

# 检查上传文件
ls -la src/backend/uploads/
```

### 2. 备份重要数据

```bash
# 备份数据库
mongodump --db mumble --out /tmp/mumble-backup

# 备份上传文件
tar -czf /tmp/uploads-backup.tar.gz -C src/backend uploads

# 备份环境配置
cp src/backend/.env /tmp/backend-env-backup
cp src/frontend/.env /tmp/frontend-env-backup
```

## 🚀 方案一：自动化AWS部署（推荐）

### 1. 使用AWS CLI创建新实例

```bash
# 确保脚本可执行
chmod +x infrastructure/aws-deploy.sh

# 创建新的t3.medium实例
./infrastructure/aws-deploy.sh your-key-pair-name

# 等待实例创建完成，记录公网IP
```

### 2. 部署应用到新实例

```bash
# 上传项目代码到新实例
scp -i ~/.ssh/your-key.pem -r ./* ec2-user@NEW_INSTANCE_IP:/opt/mumble/

# 连接到新实例
ssh -i ~/.ssh/your-key.pem ec2-user@NEW_INSTANCE_IP

# 在新实例上运行部署脚本
cd /opt/mumble
chmod +x infrastructure/deploy.sh
./infrastructure/deploy.sh
```

### 3. 迁移数据

```bash
# 在本地运行数据迁移脚本
chmod +x scripts/migrate-data.sh
./scripts/migrate-data.sh OLD_INSTANCE_IP NEW_INSTANCE_IP ~/.ssh/your-key.pem
```

## 🔧 方案二：手动迁移

### 1. 手动创建EC2实例

1. 登录AWS控制台
2. 选择EC2服务
3. 点击"启动实例"
4. 选择Amazon Linux 2 AMI
5. 选择t3.medium实例类型
6. 配置安全组（开放端口22, 80, 443, 3000, 5000）
7. 选择或创建密钥对
8. 启动实例

### 2. 配置新实例环境

```bash
# 连接到新实例
ssh -i your-key.pem ec2-user@NEW_INSTANCE_IP

# 运行环境设置脚本
curl -O https://raw.githubusercontent.com/your-repo/Mumble/main/infrastructure/ec2-setup.sh
chmod +x ec2-setup.sh
./ec2-setup.sh
```

### 3. 手动迁移代码和数据

```bash
# 从旧实例复制代码
scp -i your-key.pem -r ec2-user@OLD_IP:/home/ec2-user/hgy/Mumble/* /opt/mumble/

# 迁移数据库
mongodump --host OLD_IP --db mumble --out /tmp/backup
mongorestore --db mumble /tmp/backup/mumble

# 迁移上传文件
scp -i your-key.pem -r ec2-user@OLD_IP:/path/to/uploads/* /opt/mumble/src/backend/uploads/
```

## ✅ 迁移后验证

### 1. 检查服务状态

```bash
# 检查PM2进程
pm2 status

# 检查API健康状态
curl http://localhost:5000/api/v1/health

# 检查前端访问
curl http://localhost:3000
```

### 2. 功能测试

1. 访问前端应用: `http://NEW_INSTANCE_IP`
2. 测试录音功能
3. 检查图片生成
4. 验证图库功能
5. 测试数据持久化

### 3. 性能监控

```bash
# 监控系统资源
htop

# 查看应用日志
pm2 logs

# 检查数据库连接
mongo mumble --eval "db.runCommand('ping')"
```

## 🔒 安全配置

### 1. 更新安全组

确保新实例的安全组配置正确：

- SSH (22): 仅允许你的IP
- HTTP (80): 0.0.0.0/0
- HTTPS (443): 0.0.0.0/0
- API (5000): 0.0.0.0/0（生产环境建议限制）
- Dev (3000): 仅开发时开放

### 2. 配置SSL证书

```bash
# 安装Certbot
sudo yum install -y certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🌐 DNS更新

1. 更新域名DNS记录指向新实例IP
2. 等待DNS传播（通常5-30分钟）
3. 验证域名访问

## 🧹 清理工作

### 1. 验证新环境稳定运行

等待24-48小时，确保新环境稳定运行

### 2. 关闭旧实例

```bash
# 停止旧实例上的服务
ssh -i your-key.pem ec2-user@OLD_IP
pm2 stop all
sudo systemctl stop mongod

# 在AWS控制台终止旧实例
```

### 3. 清理备份文件

```bash
# 删除临时备份文件
rm -rf /tmp/mumble-backup*
rm -rf /tmp/uploads-backup*
```

## 📊 性能优化建议

### t3.medium实例优化

- **CPU**: 2 vCPU，适合中等负载
- **内存**: 4 GB，建议为MongoDB预留1-2GB
- **网络**: 最高5 Gbps，适合图片上传/下载
- **存储**: 使用GP3 EBS卷获得更好性能

### 应用优化

```bash
# 配置PM2集群模式
pm2 start ecosystem.config.js --env production

# 启用Nginx缓存
# 编辑 /etc/nginx/conf.d/mumble.conf 添加缓存配置

# 配置MongoDB索引
mongo mumble --eval "db.images.createIndex({userId: 1, createdAt: -1})"
```

## 🆘 故障排除

### 常见问题

1. **API无法访问**
   ```bash
   # 检查端口监听
   netstat -tlnp | grep :5000
   
   # 检查防火墙
   sudo iptables -L
   ```

2. **数据库连接失败**
   ```bash
   # 检查MongoDB状态
   sudo systemctl status mongod
   
   # 查看MongoDB日志
   sudo tail -f /var/log/mongodb/mongod.log
   ```

3. **前端无法加载**
   ```bash
   # 检查Nginx配置
   sudo nginx -t
   
   # 重启Nginx
   sudo systemctl restart nginx
   ```

## 📞 支持

如果遇到问题：

1. 查看项目日志: `pm2 logs`
2. 检查系统日志: `sudo journalctl -f`
3. 参考项目文档: `/docs`
4. 提交Issue到项目仓库

---

**迁移完成后，你的Mumble应用将在新的t3.medium实例上稳定运行！** 🎉
