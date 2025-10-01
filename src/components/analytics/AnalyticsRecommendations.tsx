import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Sparkles, Target, TrendingUp, BookOpen, MessageCircle, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export const AnalyticsRecommendations = () => {
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
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  };

  return (
    <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border border-secondary-100/50 dark:border-secondary-900/50 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-xl bg-clip-text text-transparent bg-gradient-to-r from-secondary-600 to-accent-600 dark:from-secondary-400 dark:to-accent-400">Recommendations</CardTitle>
        <CardDescription>Personalized suggestions to improve your performance</CardDescription>
      </CardHeader>
      <CardContent>
        <motion.div 
          className="space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <Recommendation
              icon={<Sparkles className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
              title="Practice Technical Scenarios"
              description="Focus on scenarios involving product specifications and technical troubleshooting to improve your technical knowledge."
              actionText="Start Technical Training"
            />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Recommendation
              icon={<Target className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />}
              title="Enhance Negotiation Skills"
              description="Try advanced negotiation scenarios to improve your ability to handle complex pricing discussions."
              actionText="Practice Negotiation"
            />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Recommendation
              icon={<TrendingUp className="h-5 w-5 text-accent-600 dark:text-accent-400" />}
              title="Maintain Strong Performance"
              description="Continue practicing active listening scenarios to maintain your high proficiency in this area."
              actionText="Continue Training"
            />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Recommendation
              icon={<BookOpen className="h-5 w-5 text-success-600 dark:text-success-400" />}
              title="Review Product Knowledge"
              description="Spend time reviewing the latest product documentation to stay current with features and benefits."
              actionText="Access Resources"
            />
          </motion.div>
        </motion.div>
      </CardContent>
    </Card>
  );
};

interface RecommendationProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionText: string;
}

const Recommendation: React.FC<RecommendationProps> = ({ icon, title, description, actionText }) => {
  return (
    <div className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-200">
      <div className="flex-shrink-0">
        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-inner">
          {icon}
        </div>
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
          {title}
          <Zap className="h-3 w-3 ml-1 text-yellow-500" />
        </h4>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{description}</p>
        <button className="mt-2 text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center">
          {actionText}
          <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};