import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, ChevronRight, Tag, Clock, BarChart3 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { ScenarioDifficulty } from '../../types';

interface ExploreProps {
  onClose: () => void;
}

export const ExploreScenarios = ({ onClose }: ExploreProps) => {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    try {
      const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setScenarios(data || []);
    } catch (err) {
      console.error('Error loading scenarios:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredScenarios = scenarios.filter(scenario =>
    scenario.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scenario.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDifficultyColor = (difficulty: ScenarioDifficulty) => {
    switch (difficulty) {
      case ScenarioDifficulty.BEGINNER:
        return 'bg-success-100 text-success-800 dark:bg-success-900/50 dark:text-success-300';
      case ScenarioDifficulty.INTERMEDIATE:
        return 'bg-warning-100 text-warning-800 dark:bg-warning-900/50 dark:text-warning-300';
      case ScenarioDifficulty.ADVANCED:
        return 'bg-error-100 text-error-800 dark:bg-error-900/50 dark:text-error-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Explore Role-Plays</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-4">
        <Input
          placeholder="Search role-plays"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search className="h-5 w-5" />}
          fullWidth
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-3">
          {filteredScenarios.map((scenario) => (
            <motion.div
              key={scenario.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group cursor-pointer"
              onClick={() => navigate(`/role-plays/${scenario.id}`)}
            >
              <Card className="hover:shadow-md transition-all duration-200 overflow-hidden">
                <div className="p-4">
                  {scenario.cover_image_url && (
                    <div className="h-32 -mx-4 -mt-4 mb-4 bg-cover bg-center" style={{ backgroundImage: `url(${scenario.cover_image_url})` }} />
                  )}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                        {scenario.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                        {scenario.description}
                      </p>
                      <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {scenario.estimated_time}
                        </span>
                        <span className="flex items-center">
                          <BarChart3 className="h-4 w-4 mr-1" />
                          {scenario.completion_rate}% completion
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {scenario.tags?.map((tag: string, index: number) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-200"
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary-500 dark:text-gray-600 dark:group-hover:text-primary-400" />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};