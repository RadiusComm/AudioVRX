import React from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Input } from '../ui/Input';

interface ScenarioSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const ScenarioSearch: React.FC<ScenarioSearchProps> = ({
  searchTerm,
  onSearchChange,
}) => {
  return (
    <motion.div 
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-8 p-6 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center">
        <div className="flex-1">
          <Input
            leftIcon={<Search className="h-5 w-5" />}
            placeholder="Search for roleplays"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-transparent"
            fullWidth
          />
        </div>
      </div>
    </motion.div>
  );
};