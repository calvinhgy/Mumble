#!/bin/bash
# Mumble数据备份脚本

set -e

# 配置
BACKUP_DIR="/opt/mumble/backups"
S3_BACKUP_BUCKET="mumble-backups-$(date +%Y%m%d)"
RETENTION_DAYS=30

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 创建备份目录
create_backup_dir() {
    mkdir -p $BACKUP_DIR
    log_info "备份目录已创建: $BACKUP_DIR"
}

# 备份MongoDB数据
backup_mongodb() {
    log_info "开始备份MongoDB数据..."
    
    if [ -z "$MONGODB_URI" ]; then
        log_error "MongoDB连接字符串未配置"
        return 1
    fi
    
    local backup_file="$BACKUP_DIR/mongodb_backup_$(date +%Y%m%d_%H%M%S).gz"
    
    # 使用mongodump备份（需要安装MongoDB工具）
    if command -v mongodump &> /dev/null; then
        mongodump --uri="$MONGODB_URI" --archive="$backup_file" --gzip
        log_info "MongoDB备份完成: $backup_file"
    else
        log_warn "mongodump未安装，跳过MongoDB备份"
    fi
}

# 备份应用文件
backup_application() {
    log_info "开始备份应用文件..."
    
    local backup_file="$BACKUP_DIR/app_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
    
    # 备份应用代码和配置
    tar -czf "$backup_file" \
        --exclude="node_modules" \
        --exclude="build" \
        --exclude="uploads" \
        --exclude="backups" \
        -C /opt/mumble \
        .
    
    log_info "应用文件备份完成: $backup_file"
}

# 备份上传文件
backup_uploads() {
    log_info "开始备份上传文件..."
    
    local uploads_dir="/opt/mumble/src/backend/uploads"
    local backup_file="$BACKUP_DIR/uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
    
    if [ -d "$uploads_dir" ] && [ "$(ls -A $uploads_dir)" ]; then
        tar -czf "$backup_file" -C "$uploads_dir" .
        log_info "上传文件备份完成: $backup_file"
    else
        log_warn "上传目录为空或不存在，跳过备份"
    fi
}

# 备份系统配置
backup_system_config() {
    log_info "开始备份系统配置..."
    
    local config_backup="$BACKUP_DIR/system_config_$(date +%Y%m%d_%H%M%S).tar.gz"
    
    tar -czf "$config_backup" \
        /etc/nginx/conf.d/mumble.conf \
        /opt/mumble/.env \
        /opt/mumble/ecosystem.config.js \
        2>/dev/null || true
    
    log_info "系统配置备份完成: $config_backup"
}

# 上传备份到S3
upload_to_s3() {
    log_info "上传备份文件到S3..."
    
    if ! command -v aws &> /dev/null; then
        log_warn "AWS CLI未安装，跳过S3上传"
        return
    fi
    
    # 创建S3备份桶（如果不存在）
    aws s3 mb "s3://$S3_BACKUP_BUCKET" 2>/dev/null || true
    
    # 上传所有备份文件
    for backup_file in $BACKUP_DIR/*_$(date +%Y%m%d)_*.{gz,tar.gz}; do
        if [ -f "$backup_file" ]; then
            aws s3 cp "$backup_file" "s3://$S3_BACKUP_BUCKET/"
            log_info "已上传: $(basename $backup_file)"
        fi
    done
    
    log_info "S3上传完成"
}

# 清理旧备份
cleanup_old_backups() {
    log_info "清理旧备份文件..."
    
    # 清理本地旧备份
    find $BACKUP_DIR -name "*.gz" -type f -mtime +$RETENTION_DAYS -delete
    find $BACKUP_DIR -name "*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete
    
    # 清理S3旧备份
    if command -v aws &> /dev/null; then
        aws s3 ls "s3://$S3_BACKUP_BUCKET/" | while read -r line; do
            file_date=$(echo $line | awk '{print $1}')
            file_name=$(echo $line | awk '{print $4}')
            
            if [ -n "$file_date" ] && [ -n "$file_name" ]; then
                file_timestamp=$(date -d "$file_date" +%s)
                cutoff_timestamp=$(date -d "$RETENTION_DAYS days ago" +%s)
                
                if [ $file_timestamp -lt $cutoff_timestamp ]; then
                    aws s3 rm "s3://$S3_BACKUP_BUCKET/$file_name"
                    log_info "已删除旧备份: $file_name"
                fi
            fi
        done
    fi
    
    log_info "旧备份清理完成"
}

# 验证备份完整性
verify_backups() {
    log_info "验证备份完整性..."
    
    local error_count=0
    
    for backup_file in $BACKUP_DIR/*_$(date +%Y%m%d)_*.{gz,tar.gz}; do
        if [ -f "$backup_file" ]; then
            if ! gzip -t "$backup_file" 2>/dev/null && ! tar -tzf "$backup_file" >/dev/null 2>&1; then
                log_error "备份文件损坏: $(basename $backup_file)"
                ((error_count++))
            else
                log_info "备份文件完整: $(basename $backup_file)"
            fi
        fi
    done
    
    if [ $error_count -eq 0 ]; then
        log_info "所有备份文件验证通过"
    else
        log_error "发现 $error_count 个损坏的备份文件"
        return 1
    fi
}

# 生成备份报告
generate_backup_report() {
    local report_file="$BACKUP_DIR/backup_report_$(date +%Y%m%d).txt"
    
    cat > "$report_file" << EOF
Mumble备份报告 - $(date)
========================

备份文件列表:
$(ls -lh $BACKUP_DIR/*_$(date +%Y%m%d)_*.{gz,tar.gz} 2>/dev/null || echo "无备份文件")

备份大小统计:
$(du -sh $BACKUP_DIR 2>/dev/null || echo "无法获取大小")

S3备份状态:
$(aws s3 ls "s3://$S3_BACKUP_BUCKET/" 2>/dev/null || echo "S3备份未配置或失败")

备份验证结果:
$(verify_backups 2>&1 | tail -5)

报告生成时间: $(date)
EOF

    log_info "备份报告已生成: $report_file"
}

# 恢复功能
restore_from_backup() {
    local backup_type="$1"
    local backup_file="$2"
    
    if [ -z "$backup_file" ]; then
        log_error "请指定备份文件"
        return 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        log_error "备份文件不存在: $backup_file"
        return 1
    fi
    
    case "$backup_type" in
        "mongodb")
            log_info "恢复MongoDB数据..."
            if command -v mongorestore &> /dev/null; then
                mongorestore --uri="$MONGODB_URI" --archive="$backup_file" --gzip --drop
                log_info "MongoDB数据恢复完成"
            else
                log_error "mongorestore未安装"
                return 1
            fi
            ;;
        "app")
            log_info "恢复应用文件..."
            cd /opt/mumble
            tar -xzf "$backup_file"
            log_info "应用文件恢复完成"
            ;;
        "uploads")
            log_info "恢复上传文件..."
            mkdir -p /opt/mumble/src/backend/uploads
            cd /opt/mumble/src/backend/uploads
            tar -xzf "$backup_file"
            log_info "上传文件恢复完成"
            ;;
        *)
            log_error "未知的备份类型: $backup_type"
            return 1
            ;;
    esac
}

# 主函数
main() {
    # 加载环境变量
    if [ -f /opt/mumble/.env ]; then
        source /opt/mumble/.env
    fi
    
    case "$1" in
        "backup")
            log_info "开始完整备份..."
            create_backup_dir
            backup_mongodb
            backup_application
            backup_uploads
            backup_system_config
            verify_backups
            upload_to_s3
            generate_backup_report
            log_info "备份完成"
            ;;
        "restore")
            restore_from_backup "$2" "$3"
            ;;
        "cleanup")
            cleanup_old_backups
            ;;
        "verify")
            verify_backups
            ;;
        *)
            echo "用法: $0 {backup|restore|cleanup|verify}"
            echo "  backup                    - 执行完整备份"
            echo "  restore <type> <file>     - 恢复指定类型的备份"
            echo "  cleanup                   - 清理旧备份文件"
            echo "  verify                    - 验证备份完整性"
            echo ""
            echo "恢复类型:"
            echo "  mongodb  - 恢复MongoDB数据"
            echo "  app      - 恢复应用文件"
            echo "  uploads  - 恢复上传文件"
            exit 1
            ;;
    esac
}

main "$@"
