import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Sparkles } from 'lucide-react';
import { ScenarioDifficulty } from '../../types';

interface ScenarioBasicInfoProps {
  formData: {
    themeOfStory: string;
    difficulty: string;
    category: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleGenerate: () => void;
  isGenerating: boolean;
  showTypeBubble: boolean;
  showCategoryBubble: boolean;
  showGenerateBubble: boolean;
  formStep: number;
}

// Guidance bubble component with animation
export const GuidanceBubble = ({ show, text, position = 'top' }: { show: boolean; text: string; position?: 'top' | 'bottom' | 'left' | 'right' }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          y: [0, -5, 0, -5, 0],
          transition: {
            y: {
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut"
            }
          }
        }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className={`absolute z-10 ${
          position === 'top' ? '-top-20 md:-top-20' : 
          position === 'bottom' ? 'top-full mt-3 md:top-full md:mt-3' : 
          position === 'left' ? 'right-full mr-3' : 
          'left-full ml-3'
        } bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-3 py-2 md:px-5 md:py-3 rounded-lg shadow-xl max-w-xs text-xs md:text-sm`}
      >
        <div className="relative">
          <p className="font-medium">{text}</p>
          {position === 'top' && (
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-secondary-600" />
          )}
          {position === 'bottom' && (
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-primary-600" />
          )}
          {position === 'left' && (
            <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-l-8 border-transparent border-l-secondary-600" />
          )}
          {position === 'right' && (
            <div className="absolute top-1/2 -left-2 transform -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-primary-600" />
          )}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

export const ScenarioBasicInfo: React.FC<ScenarioBasicInfoProps> = ({
  formData,
  handleChange,
  handleGenerate,
  isGenerating,
  showTypeBubble,
  showCategoryBubble,
  showGenerateBubble,
  formStep
}) => {
  return (
    <>
      {/* Generate button - above theme on mobile, parallel to theme on desktop */}
      <div className="block md:hidden mb-4">
        <div className="flex justify-end relative">
          <div className="relative">
            <GuidanceBubble 
              show={showGenerateBubble} 
              text="Click here to generate scenario details."
              position="bottom"
            />
            <Button
              type="button"
              onClick={handleGenerate}
              isLoading={isGenerating}
              leftIcon={<Sparkles className="h-4 w-4" />}
              className={`bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 ${formStep < 3 ? 'opacity-50' : ''} ${showGenerateBubble ? "ring-4 ring-purple-300 ring-opacity-75 shadow-lg animate-pulse" : ""}`}
              disabled={!formData.themeOfStory || formData.difficulty === ''}
            >
              Generate RolePlay
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4 relative">
        {/* Theme of Story input with desktop generate button */}
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <Input
              label="Theme of Story *"
              name="themeOfStory"
              value={formData.themeOfStory}
              onChange={handleChange}
              placeholder="Enter the theme or setting for the story"
              required
              fullWidth
            />
          </div>
          
          {/* Generate button - desktop only */}
          <div className="hidden md:flex items-end">
            <div className="relative">
              <GuidanceBubble 
                show={showGenerateBubble} 
                text="Click here to generate scenario details."
                position="bottom"
              />
              <Button
                type="button"
                onClick={handleGenerate}
                isLoading={isGenerating}
                leftIcon={<Sparkles className="h-4 w-4" />}
                className={`bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 ${formStep < 3 ? 'opacity-50' : ''} ${showGenerateBubble ? "ring-4 ring-purple-300 ring-opacity-75 shadow-lg animate-pulse" : ""}`}
                disabled={!formData.themeOfStory || formData.difficulty === ''}
              >
                Generate RolePlay
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:gap-6 relative">
        <div className="space-y-2 relative">
          <div className="relative">
            <GuidanceBubble 
              show={showTypeBubble && !formData.difficulty} 
              text="Select the difficulty level for your scenario."
              position="bottom"
            />
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Difficulty Level *
          </label>
          <select
            name="difficulty"
            value={formData.difficulty}
            onChange={handleChange}
            className={`block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${!formData.themeOfStory ? 'opacity-50 cursor-not-allowed' : ''}`}
            required
            disabled={!formData.themeOfStory}
          >
            <option value="">Select difficulty level</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="relative">
            <GuidanceBubble 
              show={showCategoryBubble && formData.difficulty && !formData.category} 
              text="Choose a category that fits your story theme."
              position="bottom"
            />
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Category *
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={`block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${!formData.difficulty ? 'opacity-50 cursor-not-allowed' : ''}`}
            required
            disabled={!formData.difficulty}
          >
            <option value="">Select category</option>
            <option value="horror">Horror</option>
            <option value="mystery">Mystery</option>
            <option value="detective">Detective</option>
            <option value="science-fiction">Science Fiction</option>
            <option value="fantasy">Fantasy</option>
            <option value="romance">Romance</option>
            <option value="thriller">Thriller</option>
            <option value="adventure">Adventure</option>
          </select>
          </div>
        </div>
      </div>
    </>
  );
};