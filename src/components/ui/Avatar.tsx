import React from 'react';
import { twMerge } from 'tailwind-merge';
import { User } from 'lucide-react';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  className?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
};

const statusClasses: Record<string, string> = {
  online: 'bg-success-500',
  offline: 'bg-gray-400',
  away: 'bg-warning-500',
  busy: 'bg-error-500',
};

const getInitials = (name: string) => {
  if (!name) return '';
  const names = name.split(' ');
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

export const Avatar = ({
  src,
  alt = '',
  name = '',
  size = 'md',
  status,
  className,
}: AvatarProps) => {
  const [imageError, setImageError] = React.useState(false);
  const initials = getInitials(name);
  const hasImage = src && !imageError;

  return (
    <div className="relative inline-block">
      <div
        className={twMerge(
          'flex items-center justify-center rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700',
          sizeClasses[size],
          className
        )}
      >
        {hasImage ? (
          <img
            src={src}
            alt={alt || name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : initials ? (
          <span className="font-medium text-gray-700 dark:text-gray-300">{initials}</span>
        ) : (
          <User className="text-gray-500 dark:text-gray-400 w-1/2 h-1/2" />
        )}
      </div>
      {status && (
        <span
          className={twMerge(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-gray-900',
            size === 'xs' ? 'w-1.5 h-1.5' : 'w-2.5 h-2.5',
            statusClasses[status]
          )}
        />
      )}
    </div>
  );
};