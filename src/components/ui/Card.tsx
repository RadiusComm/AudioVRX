import React from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  className?: string;
}

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
  className?: string;
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card = ({ children, className, ...props }: CardProps) => {
  return (
    <div
      className={twMerge(
        'bg-black/30 backdrop-blur-xl rounded-2xl border border-red-500/20 shadow-2xl overflow-hidden cinematic-glow',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className, ...props }: CardHeaderProps) => {
  return (
    <div
      className={twMerge(
        'p-6 border-b border-red-500/20',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardTitle = ({ children, className, ...props }: CardTitleProps) => {
  return (
    <h3
      className={twMerge(
        'text-xl font-semibold text-white',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardDescription = ({ children, className, ...props }: CardDescriptionProps) => {
  return (
    <p
      className={twMerge(
        'mt-1 text-sm text-gray-300 dark:text-gray-400',
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
};

export const CardContent = ({ children, className, ...props }: CardContentProps) => {
  return (
    <div
      className={twMerge(
        'p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardFooter = ({ children, className, ...props }: CardFooterProps) => {
  return (
    <div
      className={twMerge(
        'p-6 bg-black/30 border-t border-red-500/20',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};