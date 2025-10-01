import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CreditCard as Edit } from 'lucide-react';

interface ScenarioContentProps {
  formData: {
    description: string;
    initialPrompt: string;
    systemPrompt: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  hasGeneratedContent: boolean;
}

// Editable field notification component
export const EditableFieldNotice = ({ show }: { show: boolean }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 5 }}
        transition={{ duration: 0.3 }}
        className="text-xs text-primary-600 dark:text-primary-400 mt-1 flex items-center"
      >
        <Edit className="h-3 w-3 mr-1" />
        This field is auto-filled but can be edited if needed
      </motion.div>
    )}
  </AnimatePresence>
);

export const ScenarioContent: React.FC<ScenarioContentProps> = ({
  formData,
  handleChange,
  hasGeneratedContent
}) => {
  return (
    <>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className={`block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${!hasGeneratedContent ? 'opacity-50 cursor-not-allowed' : ''}`}
          placeholder="Describe the role-play and its goals"
          required
          disabled={!hasGeneratedContent}
        />
        <EditableFieldNotice show={hasGeneratedContent} />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Initial Prompt
        </label>
        <textarea
          name="initialPrompt"
          value={formData.initialPrompt}
          onChange={handleChange}
          rows={4}
          className={`block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${!hasGeneratedContent ? 'opacity-50 cursor-not-allowed' : ''}`}
          placeholder="Enter the initial conversation prompt"
          required
          disabled={!hasGeneratedContent}
        />
        <EditableFieldNotice show={hasGeneratedContent} />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          System Prompt
        </label>
        <textarea
          name="systemPrompt"
          value={formData.systemPrompt}
          onChange={handleChange}
          rows={4}
          className={`block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${!hasGeneratedContent ? 'opacity-50 cursor-not-allowed' : ''}`}
          placeholder="Enter the system prompt for the AI"
          disabled={!hasGeneratedContent}
        />
        <EditableFieldNotice show={hasGeneratedContent} />
      </div>
    </>
  );
};