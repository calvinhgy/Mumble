import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Header from '../components/Header';
import { updatePreferences } from '../store/appSlice';

const SettingsPage = () => {
  const dispatch = useDispatch();
  const { preferences } = useSelector(state => state.app);
  
  // 创建本地状态副本
  const [localPreferences, setLocalPreferences] = useState({
    ...preferences
  });
  
  // 处理图像风格变化
  const handleStyleChange = (style) => {
    setLocalPreferences({
      ...localPreferences,
      imageStyle: style
    });
  };
  
  // 处理隐私设置变化
  const handlePrivacyChange = (key, value) => {
    setLocalPreferences({
      ...localPreferences,
      privacySettings: {
        ...localPreferences.privacySettings,
        [key]: value
      }
    });
  };
  
  // 处理通知设置变化
  const handleNotificationChange = (key, value) => {
    setLocalPreferences({
      ...localPreferences,
      notifications: {
        ...localPreferences.notifications,
        [key]: value
      }
    });
  };
  
  // 保存设置
  const handleSave = () => {
    dispatch(updatePreferences(localPreferences));
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Header title="设置" showBackButton={true} showGalleryButton={false} />
      
      <div className="p-4">
        {/* 图像风格设置 */}
        <div className="card mb-4">
          <h2 className="text-lg font-medium mb-3">图像风格</h2>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              className={`p-3 rounded-lg border ${
                localPreferences.imageStyle === 'balanced' 
                  ? 'border-primary bg-primary bg-opacity-10' 
                  : 'border-neutral border-opacity-20'
              }`}
              onClick={() => handleStyleChange('balanced')}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">🎨</div>
                <div className="font-medium">平衡</div>
                <div className="text-xs text-neutral text-opacity-70">自动选择最适合的风格</div>
              </div>
            </button>
            
            <button
              className={`p-3 rounded-lg border ${
                localPreferences.imageStyle === 'realistic' 
                  ? 'border-primary bg-primary bg-opacity-10' 
                  : 'border-neutral border-opacity-20'
              }`}
              onClick={() => handleStyleChange('realistic')}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">📷</div>
                <div className="font-medium">写实</div>
                <div className="text-xs text-neutral text-opacity-70">照片级真实感</div>
              </div>
            </button>
            
            <button
              className={`p-3 rounded-lg border ${
                localPreferences.imageStyle === 'artistic' 
                  ? 'border-primary bg-primary bg-opacity-10' 
                  : 'border-neutral border-opacity-20'
              }`}
              onClick={() => handleStyleChange('artistic')}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">🖌️</div>
                <div className="font-medium">艺术</div>
                <div className="text-xs text-neutral text-opacity-70">绘画风格表现</div>
              </div>
            </button>
            
            <button
              className={`p-3 rounded-lg border ${
                localPreferences.imageStyle === 'abstract' 
                  ? 'border-primary bg-primary bg-opacity-10' 
                  : 'border-neutral border-opacity-20'
              }`}
              onClick={() => handleStyleChange('abstract')}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">🔮</div>
                <div className="font-medium">抽象</div>
                <div className="text-xs text-neutral text-opacity-70">创意抽象表达</div>
              </div>
            </button>
          </div>
        </div>
        
        {/* 隐私设置 */}
        <div className="card mb-4">
          <h2 className="text-lg font-medium mb-3">隐私设置</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">保存录音</div>
                <div className="text-xs text-neutral text-opacity-70">临时存储录音以改进体验</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={localPreferences.privacySettings.saveAudioRecordings}
                  onChange={(e) => handlePrivacyChange('saveAudioRecordings', e.target.checked)}
                />
                <div className="w-11 h-6 bg-neutral bg-opacity-20 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
            
            <div>
              <div className="font-medium mb-2">位置精度</div>
              <select
                className="w-full p-2 border border-neutral border-opacity-20 rounded-lg bg-white"
                value={localPreferences.privacySettings.locationPrecision}
                onChange={(e) => handlePrivacyChange('locationPrecision', e.target.value)}
              >
                <option value="exact">精确位置</option>
                <option value="city">仅城市</option>
                <option value="none">不使用位置</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">分享分析数据</div>
                <div className="text-xs text-neutral text-opacity-70">帮助我们改进应用</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={localPreferences.privacySettings.shareAnalyticsData}
                  onChange={(e) => handlePrivacyChange('shareAnalyticsData', e.target.checked)}
                />
                <div className="w-11 h-6 bg-neutral bg-opacity-20 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
          </div>
        </div>
        
        {/* 通知设置 */}
        <div className="card mb-4">
          <h2 className="text-lg font-medium mb-3">通知设置</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">图像生成完成</div>
                <div className="text-xs text-neutral text-opacity-70">当图像生成完成时通知</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={localPreferences.notifications.imageGeneration}
                  onChange={(e) => handleNotificationChange('imageGeneration', e.target.checked)}
                />
                <div className="w-11 h-6 bg-neutral bg-opacity-20 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">新功能通知</div>
                <div className="text-xs text-neutral text-opacity-70">接收新功能和更新通知</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={localPreferences.notifications.newFeatures}
                  onChange={(e) => handleNotificationChange('newFeatures', e.target.checked)}
                />
                <div className="w-11 h-6 bg-neutral bg-opacity-20 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
          </div>
        </div>
        
        {/* 关于 */}
        <div className="card mb-4">
          <h2 className="text-lg font-medium mb-3">关于</h2>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>版本</span>
              <span className="text-neutral text-opacity-70">1.0.0</span>
            </div>
            
            <div>
              <a href="#" className="text-primary">隐私政策</a>
            </div>
            
            <div>
              <a href="#" className="text-primary">服务条款</a>
            </div>
          </div>
        </div>
        
        {/* 保存按钮 */}
        <div className="mt-6 mb-8">
          <button 
            className="btn-primary w-full"
            onClick={handleSave}
          >
            保存设置
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
