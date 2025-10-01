import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';

export const CallToAction = () => {
  const navigate = useNavigate();

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-primary-600 dark:bg-primary-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4 px-4">
          Ready to Improve Your Customer Interactions?
        </h2>
        <p className="text-lg sm:text-xl text-primary-100 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
          Join thousands of professionals who are already enhancing their communication skills with Conversate AI.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4">
          <Button
            size="md"
            variant="secondary"
            onClick={() => navigate('/signup')}
            className="w-full sm:w-auto"
          >
            Start Free Trial
          </Button>
          <Button
            size="md"
            variant="outline"
            className="text-white border-white hover:bg-primary-700 dark:hover:bg-primary-800 w-full sm:w-auto"
            onClick={() => navigate('/contact')}
          >
            Contact Sales
          </Button>
        </div>
      </div>
    </section>
  );
};