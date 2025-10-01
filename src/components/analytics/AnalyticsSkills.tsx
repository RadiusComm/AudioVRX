import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { motion } from 'framer-motion';

export const AnalyticsSkills = () => {
  const skills = [
    { name: "Active Listening", progress: 90, color: "from-primary-500 to-primary-400" },
    { name: "Empathy", progress: 85, color: "from-secondary-500 to-secondary-400" },
    { name: "Problem Solving", progress: 75, color: "from-accent-500 to-accent-400" },
    { name: "Negotiation", progress: 70, color: "from-success-500 to-success-400" },
    { name: "Technical Knowledge", progress: 65, color: "from-warning-500 to-warning-400" },
  ];

  return (
    <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border border-primary-100/50 dark:border-primary-900/50 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-xl bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400">Your Skills</CardTitle>
        <CardDescription>Current proficiency levels across different skills</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {skills.map((skill, index) => (
            <SkillBar 
              key={skill.name} 
              skill={skill.name} 
              progress={skill.progress} 
              color={skill.color}
              delay={index * 0.1}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

interface SkillBarProps {
  skill: string;
  progress: number;
  color: string;
  delay: number;
}

const SkillBar: React.FC<SkillBarProps> = ({ skill, progress, color, delay }) => {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{skill}</span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
        <motion.div
          className={`bg-gradient-to-r ${color} h-2.5 rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ 
            duration: 1, 
            delay: delay,
            ease: "easeOut"
          }}
        />
      </div>
    </div>
  );
};