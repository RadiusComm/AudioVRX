import React from 'react';
import { motion } from 'framer-motion';

interface UserHeaderProps {
  activeTab: 'users' | 'stores';
}

export const UserHeader: React.FC<UserHeaderProps> = ({ activeTab }) => {
  return (
    <motion.div 
      className="flex flex-col md:flex-row md:items-center md:justify-between mb-8"
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
    >
      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400">
          User Management
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Manage and monitor user accounts and permissions
        </p>
      </div>
    </motion.div>
  );
};