import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Globe, BarChart, Users2 } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';

const features = [
  {
    title: 'AI-Powered Conversations',
    description: 'Practice with our advanced AI that adapts to your responses and provides real-time feedback.',
    icon: MessageCircle,
  },
  {
    title: 'Real-world Role-Plays',
    description: 'Train with industry-specific scenarios designed by experts to simulate real customer interactions.',
    icon: Globe,
  },
  {
    title: 'Detailed Analytics',
    description: 'Track your progress with comprehensive analytics and performance insights.',
    icon: BarChart,
  },
  {
    title: 'Team Management',
    description: 'Monitor and manage your team\'s training progress with detailed reports and insights.',
    icon: Users2,
  },
];

export const Features = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
      <motion.div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <motion.h2 
            variants={itemVariants}
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4"
          >
            Powerful Features
          </motion.h2>
          <motion.p 
            variants={itemVariants}
            className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 px-4"
          >
            Everything you need to improve customer interactions
          </motion.p>
        </div>
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8"
          variants={containerVariants}
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="h-full transform hover:scale-105 transition-transform duration-300 hover:shadow-xl">
                <CardContent className="p-4 sm:p-6">
                  <div className="bg-primary-50 dark:bg-primary-900/50 w-10 sm:w-12 h-10 sm:h-12 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                    <feature.icon className="w-5 sm:w-6 h-5 sm:h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900 dark:text-white">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};