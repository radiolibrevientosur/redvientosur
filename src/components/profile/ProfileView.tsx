import React from 'react';
import { User, AtSign, Link as LinkIcon, Edit2, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface ProfileViewProps {
  onEdit: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ onEdit }) => {
  const { user, logout } = useAuthStore();
  
  if (!user) {
    return null;
  }
  
  return (
    <div className="space-y-6 pb-6">
      {/* Profile Header */}
      <div className="relative">
        <div className="h-32 bg-gradient-to-r from-primary-600 to-secondary-500 rounded-t-xl"></div>
        <div className="absolute left-0 right-0 -bottom-16 flex justify-center">
          <div className="avatar h-32 w-32 ring-4 ring-white dark:ring-gray-900">
            <img 
              src={user.avatar} 
              alt={user.displayName} 
              className="avatar-img"
            />
          </div>
        </div>
      </div>
      
      {/* Profile Actions */}
      <div className="flex justify-end pt-12 px-4">
        <button 
          onClick={onEdit}
          className="btn btn-ghost text-sm flex items-center space-x-1"
        >
          <Edit2 className="h-4 w-4 mr-1" />
          Edit Profile
        </button>
      </div>
      
      {/* Profile Info */}
      <div className="text-center px-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {user.displayName}
        </h1>
        <p className="text-primary-600 dark:text-primary-400 font-medium mt-1">
          @{user.username}
        </p>
        <p className="text-gray-600 dark:text-gray-300 mt-3 max-w-md mx-auto">
          Creative artist and designer passionate about digital art and modern aesthetics.
        </p>
      </div>
      
      {/* Contact Info */}
      <div className="px-4">
        <div className="card divide-y divide-gray-100 dark:divide-gray-800">
          <div className="flex items-center py-3 px-2">
            <User className="h-5 w-5 text-gray-500 mr-3" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Display Name</p>
              <p className="font-medium">{user.displayName}</p>
            </div>
          </div>
          
          <div className="flex items-center py-3 px-2">
            <AtSign className="h-5 w-5 text-gray-500 mr-3" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Username</p>
              <p className="font-medium">@{user.username}</p>
            </div>
          </div>
          
          <div className="flex items-center py-3 px-2">
            <LinkIcon className="h-5 w-5 text-gray-500 mr-3" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Website</p>
              <a 
                href="#" 
                className="font-medium text-primary-600 dark:text-primary-400 hover:underline"
              >
                https://example.com
              </a>
            </div>
          </div>
        </div>
      </div>
      
      {/* Account Actions */}
      <div className="px-4">
        <div className="card">
          <button className="flex items-center justify-between w-full py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
            <div className="flex items-center">
              <Settings className="h-5 w-5 text-gray-500 mr-3" />
              <span>Account Settings</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          
          <button 
            onClick={logout}
            className="flex items-center w-full py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg mt-2 text-red-600 dark:text-red-400"
          >
            <LogOut className="h-5 w-5 mr-3" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;