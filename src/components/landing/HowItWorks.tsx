import React from 'react';
import { Play, MessageCircle, TrendingUp } from 'lucide-react';

export const HowItWorks = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">How It Works</h2>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 px-4">Three simple steps to improve your communication skills</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="text-center">
            <div className="bg-primary-50 dark:bg-primary-900/50 w-12 sm:w-16 h-12 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Play className="w-6 sm:w-8 h-6 sm:h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white">1. Choose a Scenario</h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 px-2">Select from our library of industry-specific conversation scenarios.</p>
          </div>
          <div className="text-center">
            <div className="bg-primary-50 dark:bg-primary-900/50 w-12 sm:w-16 h-12 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <MessageCircle className="w-6 sm:w-8 h-6 sm:h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white">2. Practice with AI</h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 px-2">Engage in realistic conversations with our AI and receive instant feedback.</p>
          </div>
          <div className="text-center">
            <div className="bg-primary-50 dark:bg-primary-900/50 w-12 sm:w-16 h-12 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <TrendingUp className="w-6 sm:w-8 h-6 sm:h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white sm:col-span-2 md:col-span-1">3. Track Progress</h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 px-2 sm:col-span-2 md:col-span-1">Monitor your improvement with detailed analytics and performance metrics.</p>
          </div>
        </div>
      </div>
    </section>
  );
};