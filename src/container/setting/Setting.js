import React, { useState, useEffect } from 'react';
import { 
  FaUser, 
  FaLock, 
  FaBell, 
  FaPalette, 
  FaWallet, 
  FaRobot, 
  FaShieldAlt, 
  FaDownload, 
  FaUpload,
  FaEye,
  FaEyeSlash,
  FaSave,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaInfo
} from 'react-icons/fa';
import { useWallet } from '../../hooks/useWallet';
import { useProfile } from '../../hooks/useProfile';

const Setting = ({ contract }) => {
  const { account, disconnectWallet } = useWallet();
  const { profile } = useProfile(contract);
  
  // Settings state
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Profile settings
  const [profileSettings, setProfileSettings] = useState({
    displayName: '',
    bio: '',
    location: '',
    website: '',
    showEmail: false,
    showLocation: false,
  });

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showPosts: 'public',
    allowDirectMessages: true,
    showOnlineStatus: true,
    allowTagging: true,
    dataAnalytics: false,
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    postLikes: true,
    postComments: true,
    newFollowers: true,
    directMessages: true,
    mentions: true,
    tips: true,
    emailNotifications: false,
    pushNotifications: true,
  });

  // Theme settings
  const [themeSettings, setThemeSettings] = useState({
    theme: 'dark',
    accentColor: '#3B82F6',
    fontSize: 'medium',
    compactMode: false,
  });

  // AI Assistant settings
  const [aiSettings, setAISettings] = useState({
    enableSuggestions: true,
    autoTrigger: true,
    suggestionDelay: 1000,
    contextAware: true,
    fallbackSuggestions: true,
  });

  // Blockchain settings
  const [blockchainSettings, setBlockchainSettings] = useState({
    showTransactionHistory: true,
    autoApproveSmallTips: false,
    preferredGasPrice: 'standard',
    showBalances: true,
  });

  // Load settings from localStorage on component mount
  useEffect(() => {
    const loadSettings = () => {
      const savedSettings = localStorage.getItem('decentratwitter_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setProfileSettings(prev => ({ ...prev, ...parsed.profile }));
        setPrivacySettings(prev => ({ ...prev, ...parsed.privacy }));
        setNotificationSettings(prev => ({ ...prev, ...parsed.notifications }));
        setThemeSettings(prev => ({ ...prev, ...parsed.theme }));
        setAISettings(prev => ({ ...prev, ...parsed.ai }));
        setBlockchainSettings(prev => ({ ...prev, ...parsed.blockchain }));
      }
    };
    loadSettings();
  }, []);

  // Save settings to localStorage
  const saveSettings = () => {
    setIsLoading(true);
    const allSettings = {
      profile: profileSettings,
      privacy: privacySettings,
      notifications: notificationSettings,
      theme: themeSettings,
      ai: aiSettings,
      blockchain: blockchainSettings,
    };
    
    localStorage.setItem('decentratwitter_settings', JSON.stringify(allSettings));
    
    setTimeout(() => {
      setIsLoading(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: FaUser },
    { id: 'privacy', name: 'Privacy', icon: FaLock },
    { id: 'notifications', name: 'Notifications', icon: FaBell },
    { id: 'appearance', name: 'Appearance', icon: FaPalette },
    { id: 'blockchain', name: 'Blockchain', icon: FaWallet },
    { id: 'ai', name: 'AI Assistant', icon: FaRobot },
    { id: 'security', name: 'Security', icon: FaShieldAlt },
    { id: 'data', name: 'Data', icon: FaDownload },
  ];

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white mb-4">Profile Settings</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Display Name
          </label>
          <input
            type="text"
            value={profileSettings.displayName}
            onChange={(e) => setProfileSettings(prev => ({ ...prev, displayName: e.target.value }))}
            className="w-full p-3 bg-[#2A2A2A] border border-[#404040] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your display name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Bio
          </label>
          <textarea
            value={profileSettings.bio}
            onChange={(e) => setProfileSettings(prev => ({ ...prev, bio: e.target.value }))}
            rows="3"
            className="w-full p-3 bg-[#2A2A2A] border border-[#404040] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Tell others about yourself..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Location
            </label>
            <input
              type="text"
              value={profileSettings.location}
              onChange={(e) => setProfileSettings(prev => ({ ...prev, location: e.target.value }))}
              className="w-full p-3 bg-[#2A2A2A] border border-[#404040] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your location"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Website
            </label>
            <input
              type="url"
              value={profileSettings.website}
              onChange={(e) => setProfileSettings(prev => ({ ...prev, website: e.target.value }))}
              className="w-full p-3 bg-[#2A2A2A] border border-[#404040] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://yourwebsite.com"
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={profileSettings.showEmail}
              onChange={(e) => setProfileSettings(prev => ({ ...prev, showEmail: e.target.checked }))}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-gray-300">Show email on profile</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={profileSettings.showLocation}
              onChange={(e) => setProfileSettings(prev => ({ ...prev, showLocation: e.target.checked }))}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-gray-300">Show location on profile</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white mb-4">Privacy & Safety</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Profile Visibility
          </label>
          <select
            value={privacySettings.profileVisibility}
            onChange={(e) => setPrivacySettings(prev => ({ ...prev, profileVisibility: e.target.value }))}
            className="w-full p-3 bg-[#2A2A2A] border border-[#404040] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="public">Public - Anyone can see</option>
            <option value="friends">Friends only</option>
            <option value="private">Private - Only me</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Post Visibility
          </label>
          <select
            value={privacySettings.showPosts}
            onChange={(e) => setPrivacySettings(prev => ({ ...prev, showPosts: e.target.value }))}
            className="w-full p-3 bg-[#2A2A2A] border border-[#404040] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="public">Public</option>
            <option value="friends">Friends only</option>
            <option value="private">Private</option>
          </select>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-gray-300">Allow direct messages</span>
            <input
              type="checkbox"
              checked={privacySettings.allowDirectMessages}
              onChange={(e) => setPrivacySettings(prev => ({ ...prev, allowDirectMessages: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="text-gray-300">Show online status</span>
            <input
              type="checkbox"
              checked={privacySettings.showOnlineStatus}
              onChange={(e) => setPrivacySettings(prev => ({ ...prev, showOnlineStatus: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="text-gray-300">Allow tagging in posts</span>
            <input
              type="checkbox"
              checked={privacySettings.allowTagging}
              onChange={(e) => setPrivacySettings(prev => ({ ...prev, allowTagging: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="text-gray-300">Allow data analytics</span>
            <input
              type="checkbox"
              checked={privacySettings.dataAnalytics}
              onChange={(e) => setPrivacySettings(prev => ({ ...prev, dataAnalytics: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </label>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white mb-4">Notifications</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-lg font-medium text-gray-300 mb-3">Post Interactions</h4>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-gray-300">Likes on my posts</span>
              <input
                type="checkbox"
                checked={notificationSettings.postLikes}
                onChange={(e) => setNotificationSettings(prev => ({ ...prev, postLikes: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </label>

            <label className="flex items-center justify-between">
              <span className="text-gray-300">Comments on my posts</span>
              <input
                type="checkbox"
                checked={notificationSettings.postComments}
                onChange={(e) => setNotificationSettings(prev => ({ ...prev, postComments: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </label>

            <label className="flex items-center justify-between">
              <span className="text-gray-300">Tips received</span>
              <input
                type="checkbox"
                checked={notificationSettings.tips}
                onChange={(e) => setNotificationSettings(prev => ({ ...prev, tips: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </label>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-medium text-gray-300 mb-3">Social</h4>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-gray-300">New followers</span>
              <input
                type="checkbox"
                checked={notificationSettings.newFollowers}
                onChange={(e) => setNotificationSettings(prev => ({ ...prev, newFollowers: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </label>

            <label className="flex items-center justify-between">
              <span className="text-gray-300">Direct messages</span>
              <input
                type="checkbox"
                checked={notificationSettings.directMessages}
                onChange={(e) => setNotificationSettings(prev => ({ ...prev, directMessages: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </label>

            <label className="flex items-center justify-between">
              <span className="text-gray-300">Mentions</span>
              <input
                type="checkbox"
                checked={notificationSettings.mentions}
                onChange={(e) => setNotificationSettings(prev => ({ ...prev, mentions: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </label>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-medium text-gray-300 mb-3">Delivery</h4>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-gray-300">Email notifications</span>
              <input
                type="checkbox"
                checked={notificationSettings.emailNotifications}
                onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </label>

            <label className="flex items-center justify-between">
              <span className="text-gray-300">Push notifications</span>
              <input
                type="checkbox"
                checked={notificationSettings.pushNotifications}
                onChange={(e) => setNotificationSettings(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white mb-4">Appearance</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Theme
          </label>
          <div className="grid grid-cols-3 gap-3">
            {['dark', 'light', 'auto'].map((theme) => (
              <button
                key={theme}
                onClick={() => setThemeSettings(prev => ({ ...prev, theme }))}
                className={`p-3 rounded-lg border-2 transition-all ${
                  themeSettings.theme === theme
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-[#404040] bg-[#2A2A2A] hover:border-gray-500'
                }`}
              >
                <div className="text-white font-medium capitalize">{theme}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Accent Color
          </label>
          <div className="grid grid-cols-6 gap-3">
            {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'].map((color) => (
              <button
                key={color}
                onClick={() => setThemeSettings(prev => ({ ...prev, accentColor: color }))}
                className={`w-12 h-12 rounded-lg border-2 transition-all ${
                  themeSettings.accentColor === color
                    ? 'border-white scale-110'
                    : 'border-[#404040] hover:scale-105'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Font Size
          </label>
          <select
            value={themeSettings.fontSize}
            onChange={(e) => setThemeSettings(prev => ({ ...prev, fontSize: e.target.value }))}
            className="w-full p-3 bg-[#2A2A2A] border border-[#404040] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>

        <label className="flex items-center justify-between">
          <span className="text-gray-300">Compact mode</span>
          <input
            type="checkbox"
            checked={themeSettings.compactMode}
            onChange={(e) => setThemeSettings(prev => ({ ...prev, compactMode: e.target.checked }))}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </label>
      </div>
    </div>
  );

  const renderAISettings = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white mb-4">AI Assistant</h3>
      
      <div className="space-y-4">
        <label className="flex items-center justify-between">
          <div>
            <span className="text-gray-300 font-medium">Enable AI Suggestions</span>
            <p className="text-sm text-gray-500">Get AI-powered text suggestions while writing posts</p>
          </div>
          <input
            type="checkbox"
            checked={aiSettings.enableSuggestions}
            onChange={(e) => setAISettings(prev => ({ ...prev, enableSuggestions: e.target.checked }))}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </label>

        <label className="flex items-center justify-between">
          <div>
            <span className="text-gray-300 font-medium">Auto-trigger Suggestions</span>
            <p className="text-sm text-gray-500">Automatically show suggestions while typing</p>
          </div>
          <input
            type="checkbox"
            checked={aiSettings.autoTrigger}
            onChange={(e) => setAISettings(prev => ({ ...prev, autoTrigger: e.target.checked }))}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={!aiSettings.enableSuggestions}
          />
        </label>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Suggestion Delay (ms)
          </label>
          <input
            type="range"
            min="500"
            max="3000"
            step="250"
            value={aiSettings.suggestionDelay}
            onChange={(e) => setAISettings(prev => ({ ...prev, suggestionDelay: parseInt(e.target.value) }))}
            disabled={!aiSettings.enableSuggestions}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>Fast (500ms)</span>
            <span>{aiSettings.suggestionDelay}ms</span>
            <span>Slow (3s)</span>
          </div>
        </div>

        <label className="flex items-center justify-between">
          <div>
            <span className="text-gray-300 font-medium">Context-aware Suggestions</span>
            <p className="text-sm text-gray-500">Use post context for better suggestions</p>
          </div>
          <input
            type="checkbox"
            checked={aiSettings.contextAware}
            onChange={(e) => setAISettings(prev => ({ ...prev, contextAware: e.target.checked }))}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={!aiSettings.enableSuggestions}
          />
        </label>

        <label className="flex items-center justify-between">
          <div>
            <span className="text-gray-300 font-medium">Fallback Suggestions</span>
            <p className="text-sm text-gray-500">Show backup suggestions if AI fails</p>
          </div>
          <input
            type="checkbox"
            checked={aiSettings.fallbackSuggestions}
            onChange={(e) => setAISettings(prev => ({ ...prev, fallbackSuggestions: e.target.checked }))}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={!aiSettings.enableSuggestions}
          />
        </label>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FaInfo className="text-blue-400 mt-1" />
            <div>
              <h4 className="text-blue-300 font-medium">Powered by Gemini AI</h4>
              <p className="text-blue-200 text-sm mt-1">
                AI suggestions are generated using Google's Gemini API to provide contextually relevant and engaging content suggestions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBlockchainSettings = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white mb-4">Blockchain & Wallet</h3>
      
      <div className="space-y-4">
        <div className="bg-[#2A2A2A] border border-[#404040] rounded-lg p-4">
          <h4 className="text-white font-medium mb-2">Connected Wallet</h4>
          <p className="text-gray-300 font-mono text-sm">{account}</p>
          <button
            onClick={disconnectWallet}
            className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Disconnect Wallet
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Preferred Gas Price
          </label>
          <select
            value={blockchainSettings.preferredGasPrice}
            onChange={(e) => setBlockchainSettings(prev => ({ ...prev, preferredGasPrice: e.target.value }))}
            className="w-full p-3 bg-[#2A2A2A] border border-[#404040] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="slow">Slow (Lower fees)</option>
            <option value="standard">Standard (Balanced)</option>
            <option value="fast">Fast (Higher fees)</option>
          </select>
        </div>

        <label className="flex items-center justify-between">
          <div>
            <span className="text-gray-300 font-medium">Show Transaction History</span>
            <p className="text-sm text-gray-500">Display transaction history in profile</p>
          </div>
          <input
            type="checkbox"
            checked={blockchainSettings.showTransactionHistory}
            onChange={(e) => setBlockchainSettings(prev => ({ ...prev, showTransactionHistory: e.target.checked }))}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </label>

        <label className="flex items-center justify-between">
          <div>
            <span className="text-gray-300 font-medium">Show Wallet Balances</span>
            <p className="text-sm text-gray-500">Display ETH balance and NFTs</p>
          </div>
          <input
            type="checkbox"
            checked={blockchainSettings.showBalances}
            onChange={(e) => setBlockchainSettings(prev => ({ ...prev, showBalances: e.target.checked }))}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </label>

        <label className="flex items-center justify-between">
          <div>
            <span className="text-gray-300 font-medium">Auto-approve Small Tips</span>
            <p className="text-sm text-gray-500">Skip confirmation for tips under 0.01 ETH</p>
          </div>
          <input
            type="checkbox"
            checked={blockchainSettings.autoApproveSmallTips}
            onChange={(e) => setBlockchainSettings(prev => ({ ...prev, autoApproveSmallTips: e.target.checked }))}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </label>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white mb-4">Security</h3>
      
      <div className="space-y-4">
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FaExclamationTriangle className="text-yellow-400 mt-1" />
            <div>
              <h4 className="text-yellow-300 font-medium">Security Notice</h4>
              <p className="text-yellow-200 text-sm mt-1">
                Your security is managed by your Web3 wallet. Always keep your private keys secure and never share them with anyone.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-white font-medium">Wallet Security Checklist</h4>
          
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 bg-[#2A2A2A] rounded-lg">
              <FaCheck className="text-green-400" />
              <span className="text-gray-300">Wallet connected securely</span>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-[#2A2A2A] rounded-lg">
              <FaCheck className="text-green-400" />
              <span className="text-gray-300">HTTPS connection active</span>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-[#2A2A2A] rounded-lg">
              <FaInfo className="text-blue-400" />
              <span className="text-gray-300">Smart contract interactions logged</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-white font-medium mb-3">Security Recommendations</h4>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li>• Use a hardware wallet for maximum security</li>
            <li>• Never share your seed phrase or private keys</li>
            <li>• Always verify transaction details before signing</li>
            <li>• Keep your wallet software updated</li>
            <li>• Be cautious of phishing attempts</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderDataSettings = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white mb-4">Data Management</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-white font-medium mb-3">Export Data</h4>
          <p className="text-gray-400 text-sm mb-4">
            Download your data including posts, profile information, and settings.
          </p>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            <FaDownload />
            Export My Data
          </button>
        </div>

        <div>
          <h4 className="text-white font-medium mb-3">Import Settings</h4>
          <p className="text-gray-400 text-sm mb-4">
            Import settings from a previously exported file.
          </p>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
            <FaUpload />
            Import Settings
          </button>
        </div>

        <div>
          <h4 className="text-white font-medium mb-3">Storage Usage</h4>
          <div className="bg-[#2A2A2A] border border-[#404040] rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-300">Local Storage</span>
              <span className="text-white">1.2 KB</span>
            </div>
            <div className="w-full bg-[#404040] rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '15%' }}></div>
            </div>
            <p className="text-gray-500 text-xs mt-2">Settings and preferences</p>
          </div>
        </div>

        <div>
          <h4 className="text-white font-medium mb-3">Clear Data</h4>
          <p className="text-gray-400 text-sm mb-4">
            Reset all settings to default values. This cannot be undone.
          </p>
          <button className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
            <FaTimes />
            Clear All Settings
          </button>
        </div>
      </div>
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileSettings();
      case 'privacy':
        return renderPrivacySettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'appearance':
        return renderAppearanceSettings();
      case 'blockchain':
        return renderBlockchainSettings();
      case 'ai':
        return renderAISettings();
      case 'security':
        return renderSecuritySettings();
      case 'data':
        return renderDataSettings();
      default:
        return renderProfileSettings();
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-[#282828] rounded-xl p-4">
              <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-[#404040] hover:text-white'
                      }`}
                    >
                      <Icon className="text-lg" />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-[#282828] rounded-xl p-6">
              {renderActiveTab()}
              
              {/* Save Button */}
              <div className="mt-8 pt-6 border-t border-[#404040]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {saveSuccess && (
                      <div className="flex items-center gap-2 text-green-400">
                        <FaCheck />
                        <span>Settings saved successfully!</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={saveSettings}
                    disabled={isLoading}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                      isLoading
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white`}
                  >
                    <FaSave />
                    {isLoading ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Setting;