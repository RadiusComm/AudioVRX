import React from 'react';
import { motion } from 'framer-motion';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { PersonalityTrait } from '../../types';

interface PersonaCardProps {
  name: string;
  role: string;
  company: string;
  avatarUrl: string;
  background: string;
  personality: PersonalityTrait[];
  onStart: () => void;
  disabled?: boolean;
}

export const PersonaCard: React.FC<PersonaCardProps> = ({
  name,
  role,
  company,
  avatarUrl,
  background,
  personality,
  onStart,
  disabled = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg"
    >
      <div className="p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <Avatar
            src={avatarUrl}
            name={name}
            size="xl"
            className="mb-4 ring-4 ring-primary-500/20"
          />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
            {name}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {role}{company ? `, ${company}` : ''}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Background
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {background}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Personality Traits
            </h4>
            <div className="flex flex-wrap gap-2">
              {personality.map((trait) => (
                <span
                  key={trait}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-200"
                >
                  {trait.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
        </div>

        <Button
          onClick={onStart}
          className="w-full mt-6 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          disabled={disabled}
        >
          {disabled ? 'Select a Role Play Type First' : 'Start Practice Session'}
        </Button>
      </div>
    </motion.div>
  );
};