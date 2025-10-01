import React from 'react';
import { Calendar, Download, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { motion } from 'framer-motion';

interface AnalyticsHeaderProps {
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

export const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({ timeRange, onTimeRangeChange }) => {
  return (
    <motion.div 
      className="flex flex-col md:flex-row md:items-center md:justify-between mb-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400 mb-2">
          Analytics Dashboard
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-300">
          Track your progress and identify areas for improvement
        </p>
      </div>
      <div className="mt-4 md:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <div className="relative">
          <button
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-900"
            onClick={() => {}}
          >
            <Calendar className="h-5 w-5 mr-2 text-primary-500 dark:text-primary-400" />
            {timeRange === 'last7Days'
              ? 'Last 7 Days'
              : timeRange === 'last30Days'
              ? 'Last 30 Days'
              : 'Last 90 Days'}
            <ChevronDown className="h-4 w-4 ml-2" />
          </button>
        </div>

        <Button
          variant="outline"
          leftIcon={<Download className="h-4 w-4" />}
          onClick={() => {}}
          className="border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/30"
        >
          Export Report
        </Button>
      </div>
    </motion.div>
  );
};