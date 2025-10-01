import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { BackgroundLines } from '../ui/background-lines';

export const Hero = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
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
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className="relative min-h-[80vh] sm:min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <BackgroundLines className="absolute inset-0" />
      
      <motion.div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-32 flex flex-col justify-center text-center relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="mb-6 sm:mb-8">
          <h1 className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400 text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
            Experience Voice Adventures
          </h1>
          <p className="mt-4 sm:mt-6 text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed px-2">
            Immerse yourself in AI-powered voice adventures and explore mysterious worlds through conversation
          </p>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-8 sm:mb-12 px-4"
        >
          <Button 
            size="md"
            onClick={() => navigate('/signup')}
            className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 w-full sm:w-auto"
          >
            Start Free Trial
          </Button>
          <Button 
            size="md"
            variant="outline" 
            onClick={() => navigate('/role-plays')}
            className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200 w-full sm:w-auto"
          >
            View Role-Plays
          </Button>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-4xl mx-auto px-4"
        >
          {[
            { title: '10,000+', subtitle: 'Trained Professionals' },
            { title: '95%', subtitle: 'Success Rate' },
            { title: '24/7', subtitle: 'AI Support' },
          ].map((stat, index) => (
            <div 
              key={index}
              className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg"
            >
              <h3 className="text-2xl sm:text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1 sm:mb-2">
                {stat.title}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">{stat.subtitle}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};