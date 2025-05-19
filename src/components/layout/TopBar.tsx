import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Moon, Sun, BellDot, Search, ArrowLeft } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  
  const shouldShowBackButton = !['/'].includes(location.pathname);
  
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Home';
      case '/favorites': return 'Favorites';
      case '/create': return 'Create';
      case '/calendar': return 'Calendar';
      case '/profile': return 'Profile';
      default: return '';
    }
  };
  
  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center w-1/3">
            {shouldShowBackButton ? (
              <button 
                onClick={() => navigate(-1)}
                className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </button>
            ) : (
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                SocialPulse
              </h1>
            )}
          </div>
          
          {getPageTitle() && (
            <div className="flex items-center w-1/3 justify-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {getPageTitle()}
              </h2>
            </div>
          )}
          
          <div className="flex items-center justify-end w-1/3 space-x-1">
            <button 
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Search"
            >
              <Search className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>
            
            <button 
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Notifications"
            >
              <BellDot className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>
            
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-gray-300" />
              ) : (
                <Moon className="h-5 w-5 text-gray-700" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;