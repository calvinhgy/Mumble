# Mumble生产环境部署指南

## 🚀 快速部署

### 前置条件

1. **AWS账户和权限**
   - 具有EC2、S3、VPC等服务的完整权限
   - 已配置AWS CLI (`aws configure`)

2. **必要工具**
   - Terraform >= 1.0
   - AWS CLI >= 2.0
   - SSH客户端

3. **外部服务账户**
   - OpenAI API账户和密钥
   - OpenWeatherMap API密钥
   - MongoDB Atlas账户

### 部署步骤

#### 1. 克隆项目并配置

```bash
git clone https://github.com/calvinhgy/Mumble.git
cd Mumble
chmod +x scripts/*.sh
```

#### 2. 配置API密钥

编辑 `infrastructure/terraform.tfvars`:

```hcl
# AWS配置
aws_region = "us-east-1"
key_pair_name = "mumble-keypair"

# API密钥
openai_api_key = "sk-your-openai-key"
openweather_api_key = "your-weather-api-key"

# MongoDB Atlas配置
mongodb_atlas_public_key = "your-atlas-public-key"
mongodb_atlas_private_key = "your-atlas-private-key"
```

#### 3. 执行部署

```bash
./scripts/deploy.sh
```

#### 4. 配置MongoDB Atlas

1. 访问 [MongoDB Atlas](https://cloud.mongodb.com/)
2. 创建M10专用集群
3. 配置网络访问白名单
4. 创建数据库用户
5. 获取连接字符串

#### 5. 配置应用环境

SSH到服务器：
```bash
ssh -i ~/.ssh/mumble-keypair.pem ec2-user@<INSTANCE_IP>
```

更新环境变量：
```bash
sudo nano /opt/mumble/.env
# 填入正确的MongoDB连接字符串和API密钥
```

重启应用：
```bash
cd /opt/mumble
pm2 restart mumble-backend
```

## 📊 监控和维护

### 自动监控

系统已配置自动监控，包括：
- 每5分钟系统健康检查
- 每天自动备份
- 每周清理旧文件
- SSL证书过期检查

### 手动监控命令

```bash
# 检查应用状态
pm2 status
systemctl status nginx

# 查看日志
pm2 logs mumble-backend
tail -f /var/log/mumble/monitor.log

# 执行健康检查
/opt/mumble/scripts/monitor.sh monitor

# 生成监控报告
/opt/mumble/scripts/monitor.sh report
```

### 备份和恢复

```bash
# 执行完整备份
/opt/mumble/scripts/backup.sh backup

# 恢复MongoDB数据
/opt/mumble/scripts/backup.sh restore mongodb /path/to/backup.gz

# 验证备份完整性
/opt/mumble/scripts/backup.sh verify
```

## 🔧 配置优化

### 性能优化

1. **Nginx配置优化**
   ```nginx
   # 启用gzip压缩
   gzip on;
   gzip_types text/plain text/css application/json application/javascript;
   
   # 设置缓存
   location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

2. **PM2配置优化**
   ```javascript
   // ecosystem.config.js
   module.exports = {
     apps: [{
       name: 'mumble-backend',
       script: './src/backend/server.js',
       instances: 'max',  // 使用所有CPU核心
       exec_mode: 'cluster',
       max_memory_restart: '1G'
     }]
   };
   ```

### 安全配置

1. **防火墙设置**
   ```bash
   # 只开放必要端口
   firewall-cmd --permanent --add-service=http
   firewall-cmd --permanent --add-service=https
   firewall-cmd --permanent --add-port=22/tcp
   firewall-cmd --reload
   ```

2. **SSL证书配置**
   ```bash
   # 使用Let's Encrypt免费证书
   sudo yum install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## 💰 成本优化

### 实例优化
- 使用Spot实例可节省60-70%成本
- 非工作时间可以停止实例
- 使用Reserved Instance获得长期折扣

### 存储优化
- 定期清理旧日志和临时文件
- 使用S3 Intelligent-Tiering自动优化存储成本
- 设置生命周期策略自动删除旧备份

### API使用优化
- 实现缓存机制减少重复API调用
- 批量处理请求
- 监控API使用量避免超额费用

## 🚨 故障排除

### 常见问题

1. **应用无法启动**
   ```bash
   # 检查日志
   pm2 logs mumble-backend
   
   # 检查环境变量
   cat /opt/mumble/.env
   
   # 重启应用
   pm2 restart mumble-backend
   ```

2. **数据库连接失败**
   ```bash
   # 检查MongoDB连接字符串
   # 确认网络白名单配置
   # 验证用户名密码
   ```

3. **API调用失败**
   ```bash
   # 检查API密钥配置
   # 验证网络连接
   # 查看API使用限制
   ```

### 紧急恢复

1. **从备份恢复**
   ```bash
   # 恢复最新备份
   /opt/mumble/scripts/backup.sh restore mongodb /opt/mumble/backups/latest_backup.gz
   ```

2. **重新部署**
   ```bash
   # 重新拉取代码
   cd /opt/mumble
   git pull origin main
   npm install --production
   pm2 restart mumble-backend
   ```

## 📈 扩展和升级

### 水平扩展
- 使用Application Load Balancer
- 部署多个EC2实例
- 使用Auto Scaling Group

### 垂直扩展
- 升级到更大的实例类型
- 增加EBS存储容量
- 优化数据库性能

### 服务升级
- 定期更新Node.js版本
- 升级依赖包
- 更新系统安全补丁

## 📞 支持和联系

如遇到问题，请：
1. 查看监控日志
2. 检查系统状态
3. 联系技术支持团队

---

**预估月度成本**: ~$137 (基于方案A配置)
**维护工作量**: 每周2-3小时
**可用性目标**: 99.5%
