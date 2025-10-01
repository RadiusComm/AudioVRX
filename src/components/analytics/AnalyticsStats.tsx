import React from 'react';
import { BarChart, LineChart, PieChart, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { motion } from 'framer-motion';

export const AnalyticsStats = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div 
      className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border border-primary-100/50 dark:border-primary-900/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-primary-100 dark:bg-primary-900/50 mr-4">
                <BarChart className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Score</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">83%</p>
                  <p className="ml-2 text-xs text-success-600 dark:text-success-400 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +5.2%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border border-secondary-100/50 dark:border-secondary-900/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-secondary-100 dark:bg-secondary-900/50 mr-4">
                <LineChart className="h-6 w-6 text-secondary-600 dark:text-secondary-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed Sessions</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">12</p>
                  <p className="ml-2 text-xs text-success-600 dark:text-success-400 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +3
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border border-accent-100/50 dark:border-accent-900/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-accent-100 dark:bg-accent-900/50 mr-4">
                <PieChart className="h-6 w-6 text-accent-600 dark:text-accent-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Practice Time</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">4h 35m</p>
                  <p className="ml-2 text-xs text-success-600 dark:text-success-400 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +1h 12m
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border border-success-100/50 dark:border-success-900/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-success-100 dark:bg-success-900/50 mr-4">
                <svg
                  className="h-6 w-6 text-success-600 dark:text-success-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Improvement Rate</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">+8.5%</p>
                  <p className="ml-2 text-xs text-success-600 dark:text-success-400 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +2.3%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};