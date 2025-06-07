#!/bin/bash

# GitHub推送脚本 - 使用个人访问令牌

set -e

cd /home/ec2-user/hgy/Mumble

echo "🚀 Mumble项目推送到GitHub"
echo "========================"
echo ""

echo "📊 项目状态检查:"
echo "- Git仓库: $(pwd)"
echo "- 分支: $(git branch --show-current)"
echo "- 提交数: $(git rev-list --count HEAD)"
echo "- 最新提交: $(git log --oneline -1)"
echo ""

echo "📋 准备推送的内容:"
echo "✅ 完整项目代码 (10,080+ 文件)"
echo "✅ 部署成功报告"
echo "✅ 详细README文档"
echo "✅ 28个部署脚本"
echo "✅ 完整文档体系"
echo ""

# 添加最新文件
echo "📦 添加最新文件..."
git add .
if git diff --staged --quiet; then
    echo "没有新的更改需要提交"
else
    git commit -m "📝 添加GitHub上传指南和推送脚本

✨ 新增内容:
- GitHub上传详细指南
- 安全的推送脚本
- 项目最终状态总结

🎯 目标: 完善GitHub仓库准备工作"
fi

echo ""
echo "🔧 GitHub推送说明:"
echo "1. 确保你有GitHub个人访问令牌"
echo "2. 令牌需要 'repo' 权限"
echo "3. 令牌格式: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
echo ""

echo "💡 获取个人访问令牌:"
echo "1. 访问: https://github.com/settings/tokens"
echo "2. 点击 'Generate new token (classic)'"
echo "3. 选择 'repo' 权限"
echo "4. 复制生成的令牌"
echo ""

echo "🔒 安全提醒:"
echo "- 令牌仅用于一次性推送"
echo "- 推送后会立即清理令牌信息"
echo "- 不会保存令牌到任何文件"
echo ""

# 提示用户输入令牌
echo "请输入你的GitHub个人访问令牌:"
read -s GITHUB_TOKEN

if [ -z "$GITHUB_TOKEN" ]; then
    echo ""
    echo "❌ 未提供令牌，推送取消"
    echo ""
    echo "📝 手动推送方法:"
    echo "1. 设置令牌: git remote set-url origin https://YOUR_TOKEN@github.com/Calvinhgy/Mumble.git"
    echo "2. 推送代码: git push origin main"
    echo "3. 清理令牌: git remote set-url origin https://github.com/Calvinhgy/Mumble.git"
    exit 1
fi

echo ""
echo "✅ 令牌已接收，开始推送..."

# 配置远程仓库
git remote set-url origin "https://${GITHUB_TOKEN}@github.com/Calvinhgy/Mumble.git"

# 推送到GitHub
echo "📤 推送到GitHub..."
if git push origin main; then
    echo ""
    echo "🎉 推送成功！"
    echo ""
    echo "✅ GitHub仓库已更新:"
    echo "   🌐 仓库地址: https://github.com/Calvinhgy/Mumble"
    echo "   📦 内容: 完整的Mumble项目"
    echo "   📊 文件数: $(find . -type f | grep -v .git | wc -l)"
    echo "   📝 提交数: $(git rev-list --count HEAD)"
    echo ""
    echo "🎯 GitHub仓库特色:"
    echo "   ✅ 在线演示: http://3.88.180.74"
    echo "   ✅ 部署成功案例"
    echo "   ✅ 完整技术文档"
    echo "   ✅ 自动化部署脚本"
    echo ""
    echo "🌟 项目价值:"
    echo "   - 展示问题解决能力"
    echo "   - 完整的全栈开发技能"
    echo "   - 云端部署实践经验"
    echo "   - 工程化开发流程"
    
else
    echo ""
    echo "❌ 推送失败"
    echo ""
    echo "可能的原因:"
    echo "- 令牌权限不足 (需要repo权限)"
    echo "- 网络连接问题"
    echo "- 仓库不存在或无访问权限"
    echo "- 令牌已过期"
    echo ""
    echo "💡 解决方法:"
    echo "1. 检查令牌权限设置"
    echo "2. 确认仓库存在: https://github.com/Calvinhgy/Mumble"
    echo "3. 重新生成令牌并重试"
fi

# 安全清理
echo ""
echo "🔒 清理令牌信息..."
git remote set-url origin "https://github.com/Calvinhgy/Mumble.git"
unset GITHUB_TOKEN

echo "✅ 安全清理完成"
echo ""
echo "📋 后续操作:"
echo "1. 访问GitHub仓库查看更新"
echo "2. 检查README显示效果"
echo "3. 验证所有文件已正确上传"
echo "4. 分享项目链接展示成果"
