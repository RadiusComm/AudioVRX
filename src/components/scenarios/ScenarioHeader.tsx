import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusCircle } from 'lucide-react';
import { Button } from '../ui/Button';

export const ScenarioHeader = () => {
  const navigate = useNavigate();

  return (
    <motion.div 
      className="flex flex-col md:flex-row md:items-center md:justify-end mb-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div>
        <Button
          leftIcon={<PlusCircle className="h-4 w-4" />}
          className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          onClick={() => navigate('/role-plays/create')}
        >
          Create Role-Play
        </Button>
      </div>
    </motion.div>
  );
};