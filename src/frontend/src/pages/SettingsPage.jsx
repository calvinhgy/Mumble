import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Header from '../components/Header';
import { updatePreferences } from '../store/appSlice';
import { STYLE_OPTIONS } from '../config/constants';
import { getDeviceInfo, getDeviceCapabilities } from '../utils/device';

const SettingsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { preferences } = useSelector(state => state.app);
  
  const [settings, setSettings] = useState({
    defaultStyle: 'balanced',
    enableLocationServices: true,
    enableNotifications: false,
    audioQuality: 'high',
    autoSave: true,
    enableVibration: true,
    theme: 'auto',
    language: 'zh-CN',
    ...preferences
  });
  
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [capabilities, setCapabilities] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    // 获取设备信息
    setDeviceInfo(getDeviceInfo());
    setCapabilities(getDeviceCapabilities());
  }, []);
  
  const handleBack = () => {
    navigate('/');
  };
  
  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      await dispatch(updatePreferences(settings));
      // 显示保存成功提示
      alert('设置保存成功！');
    } catch (error) {
      console.error('保存设置失败:', error);
      alert('保存设置失败，请稍后重试');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleReset = () => {
    const confirmed = window.confirm('确定要重置所有设置吗？');
    if (confirmed) {
      setSettings({
        defaultStyle: 'balanced',
        enableLocationServices: true,
        enableNotifications: false,
        audioQuality: 'high',
        autoSave: true,
        enableVibration: true,
        theme: 'auto',
        language: 'zh-CN'
      });
    }
  };
  
  const handleClearCache = () => {
    const confirmed = window.confirm('确定要清除缓存吗？这将删除本地存储的数据。');
    if (confirmed) {
      try {
        localStorage.clear();
        sessionStorage.clear();
        alert('缓存清除成功！');
        window.location.reload();
      } catch (error) {
        console.error('清除缓存失败:', error);
        alert('清除缓存失败');
      }
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Header title="设置" showBackButton={true} onBack={handleBack} />
      
      <div className="p-4 space-y-6">
        {/* 生成设置 */}
        <section className="bg-white rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">生成设置</h2>
          
          {/* 默认风格 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              默认风格
            </label>
            <select
              value={settings.defaultStyle}
              onChange={(e) => handleSettingChange('defaultStyle', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {STYLE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.description}
                </option>
              ))}
            </select>
          </div>
          
          {/* 音频质量 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              音频质量
            </label>
            <select
              value={settings.audioQuality}
              onChange={(e) => handleSettingChange('audioQuality', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="low">低质量 (节省流量)</option>
              <option value="medium">中等质量</option>
              <option value="high">高质量 (推荐)</option>
            </select>
          </div>
        </section>
        
        {/* 隐私设置 */}
        <section className="bg-white rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">隐私设置</h2>
          
          {/* 位置服务 */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900">位置服务</h3>
              <p className="text-sm text-gray-500">允许获取位置信息以增强图像生成</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableLocationServices}
                onChange={(e) => handleSettingChange('enableLocationServices', e.target.checked)}
                className="sr-only peer"
                disabled={!capabilities?.geolocation?.supported}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          {/* 通知 */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900">推送通知</h3>
              <p className="text-sm text-gray-500">接收图像生成完成通知</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableNotifications}
                onChange={(e) => handleSettingChange('enableNotifications', e.target.checked)}
                className="sr-only peer"
                disabled={!capabilities?.notifications?.supported}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </section>
        
        {/* 应用设置 */}
        <section className="bg-white rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">应用设置</h2>
          
          {/* 自动保存 */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900">自动保存</h3>
              <p className="text-sm text-gray-500">自动保存生成的图片到本地</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoSave}
                onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          {/* 振动反馈 */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900">振动反馈</h3>
              <p className="text-sm text-gray-500">录音时提供触觉反馈</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableVibration}
                onChange={(e) => handleSettingChange('enableVibration', e.target.checked)}
                className="sr-only peer"
                disabled={!capabilities?.vibration?.supported}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          {/* 主题 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              主题
            </label>
            <select
              value={settings.theme}
              onChange={(e) => handleSettingChange('theme', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="auto">跟随系统</option>
              <option value="light">浅色模式</option>
              <option value="dark">深色模式</option>
            </select>
          </div>
        </section>
        
        {/* 设备信息 */}
        {deviceInfo && (
          <section className="bg-white rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">设备信息</h2>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">设备ID:</span>
                <span className="font-mono text-xs">{deviceInfo.deviceId.substring(0, 16)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">操作系统:</span>
                <span>{deviceInfo.os}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">浏览器:</span>
                <span>{deviceInfo.browser}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">设备类型:</span>
                <span>
                  {deviceInfo.deviceType.isMobile ? '移动设备' : 
                   deviceInfo.deviceType.isTablet ? '平板设备' : '桌面设备'}
                </span>
              </div>
            </div>
          </section>
        )}
        
        {/* 操作按钮 */}
        <section className="space-y-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full btn-primary"
          >
            {isSaving ? '保存中...' : '保存设置'}
          </button>
          
          <button
            onClick={handleReset}
            className="w-full btn-secondary"
          >
            重置设置
          </button>
          
          <button
            onClick={handleClearCache}
            className="w-full btn-secondary text-red-600"
          >
            清除缓存
          </button>
        </section>
        
        {/* 版本信息 */}
        <section className="text-center text-sm text-gray-500">
          <p>Mumble v1.0.0</p>
          <p>© 2024 Mumble Team</p>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
