import React from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../../lib/supabase';

interface LogoProps {
  className?: string;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({ className, onClick }) => {
  const navigate = useNavigate();

  const handleClick = async () => {
    if (onClick) {
      onClick();
      return;
    }

    const user = await getCurrentUser();
    if (user) {
      navigate('/analytics');
    } else {
      navigate('/');
    }
  };

  return (
    <Link 
      to="#" 
      className={`inline-flex items-center space-x-2 ${className || ''}`}
      onClick={handleClick}
    >
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-200">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"/>
          </svg>
        </div>
        <span className="text-xl font-bold text-white tracking-wide">
          Audio<span className="text-red-500">VR</span>
        </span>
      </div>
    </Link>
  );
};