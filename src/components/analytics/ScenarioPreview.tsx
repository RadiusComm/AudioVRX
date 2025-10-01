import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { ScenarioDifficulty } from '../../types';
import { ArrowRight, Target, Clock, Tag, Play, Star, Users } from 'lucide-react';

const scenarios = [
  {
    id: '1',
    title: 'Handling Customer Objections',
    description: 'Practice responding to common customer objections in a sales conversation.',
    difficulty: ScenarioDifficulty.INTERMEDIATE,
    completionRate: 85,
    tags: ['Sales', 'Objection Handling', 'Communication'],
    estimatedTime: '15 min',
    popularity: 4.8,
  },
  {
    id: '2',
    title: 'Technical Support Troubleshooting',
    description: 'Help a customer diagnose and resolve technical issues with your product.',
    difficulty: ScenarioDifficulty.ADVANCED,
    completionRate: 72,
    tags: ['Technical Support', 'Problem Solving'],
    estimatedTime: '20 min',
    popularity: 4.5,
  },
  {
    id: '3',
    title: 'Negotiation Fundamentals',
    description: 'Practice basic negotiation techniques with a potential client.',
    difficulty: ScenarioDifficulty.BEGINNER,
    completionRate: 92,
    tags: ['Negotiation', 'Sales'],
    estimatedTime: '10 min',
    popularity: 4.9,
  },
].slice(0, 3); // Only show first 3 scenarios

const difficultyColors: Record<ScenarioDifficulty, string> = {
  [ScenarioDifficulty.BEGINNER]: 'bg-success-100 dark:bg-success-900/50 text-success-800 dark:text-success-300',
  [ScenarioDifficulty.INTERMEDIATE]: 'bg-warning-100 dark:bg-warning-900/50 text-warning-800 dark:text-warning-300',
  [ScenarioDifficulty.ADVANCED]: 'bg-error-100 dark:bg-error-900/50 text-error-800 dark:text-error-300',
  [ScenarioDifficulty.EXPERT]: 'bg-accent-100 dark:bg-accent-900/50 text-accent-800 dark:text-accent-300',
};

export const ScenarioPreview = () => {
  const navigate = useNavigate();

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
    <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border border-secondary-100/50 dark:border-secondary-900/50 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl bg-clip-text text-transparent bg-gradient-to-r from-secondary-600 to-accent-600 dark:from-secondary-400 dark:to-accent-400">Available Role-Plays</CardTitle>
          <CardDescription>Click on a role-play to view more details</CardDescription>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center text-sm font-medium"
          onClick={() => navigate('/role-plays')}
        >
          View All
          <ArrowRight className="ml-1 h-4 w-4" />
        </motion.button>
      </CardHeader>
      <CardContent>
        <motion.div 
          className="grid gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {scenarios.map((scenario, index) => (
            <motion.div
              key={scenario.id}
              variants={itemVariants}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] border border-secondary-50 dark:border-secondary-900"
              onClick={() => navigate('/role-plays')}
            >
              <div className="flex items-start justify-between">
                <div className="flex-grow">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {scenario.title}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${difficultyColors[scenario.difficulty]}`}>
                      {scenario.difficulty}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {scenario.description}
                  </p>
                  
                  <div className="mt-3 flex flex-wrap gap-2">
                    {scenario.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-200"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {scenario.estimatedTime}
                      </span>
                      <span className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {scenario.completionRate}% completion
                      </span>
                      <span className="flex items-center">
                        <Star className="h-3 w-3 mr-1 text-yellow-500" />
                        {scenario.popularity}
                      </span>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-500 text-white shadow-md hover:bg-primary-600 transition-colors duration-200"
                    >
                      <Play className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </CardContent>
    </Card>
  );
};