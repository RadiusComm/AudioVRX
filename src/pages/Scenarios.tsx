import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { ScenarioCard } from '../components/scenarios/ScenarioCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ScenarioDifficulty } from '../types';
import { supabase } from '../lib/supabase';
import { Loader2, ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';

const difficultyColors: Record<ScenarioDifficulty, string> = {
  [ScenarioDifficulty.BEGINNER]: 'bg-success-100 dark:bg-success-900/50 text-success-800 dark:text-success-300',
  [ScenarioDifficulty.INTERMEDIATE]: 'bg-warning-100 dark:bg-warning-900/50 text-warning-800 dark:text-warning-300',
  [ScenarioDifficulty.ADVANCED]: 'bg-error-100 dark:bg-error-900/50 text-error-800 dark:text-error-300',
  [ScenarioDifficulty.EXPERT]: 'bg-accent-100 dark:bg-accent-900/50 text-accent-800 dark:text-accent-300',
};

export const Scenarios = () => {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
    } catch (err: any) {
      console.error('Error loading scenarios:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteScenario = () => {
    loadScenarios();
  };

  // Group scenarios by difficulty for Netflix-style sections
  const groupedScenarios = scenarios.reduce((acc, scenario) => {
    const difficulty = scenario.difficulty;
    if (!acc[difficulty]) {
      acc[difficulty] = [];
    }
    acc[difficulty].push(scenario);
    return acc;
  }, {} as Record<string, any[]>);

  // Filter scenarios based on search
  const filteredScenarios = scenarios.filter(scenario =>
    scenario.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scenario.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (scenario.tags && scenario.tags.some((tag: string) => 
      tag.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );

  // Group filtered scenarios by difficulty
  const filteredGroupedScenarios = filteredScenarios.reduce((acc, scenario) => {
    const difficulty = scenario.difficulty;
    if (!acc[difficulty]) {
      acc[difficulty] = [];
    }
    acc[difficulty].push(scenario);
    return acc;
  }, {} as Record<string, any[]>);

  const ScrollableRow = ({ title, scenarios, sectionId }: { title: string; scenarios: any[]; sectionId: string }) => {
    const scrollContainer = React.useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
      if (scrollContainer.current) {
        const scrollAmount = 320; // Width of one card plus gap
        const currentScroll = scrollContainer.current.scrollLeft;
        const targetScroll = direction === 'left' 
          ? currentScroll - scrollAmount 
          : currentScroll + scrollAmount;
        
        scrollContainer.current.scrollTo({
          left: targetScroll,
          behavior: 'smooth'
        });
      }
    };

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4 px-6">
          <h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => scroll('left')}
              className="p-2 bg-black/30 hover:bg-black/50 border border-red-500/30"
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => scroll('right')}
              className="p-2 bg-black/30 hover:bg-black/50 border border-red-500/30"
            >
              <ChevronRight className="h-5 w-5 text-white" />
            </Button>
          </div>
        </div>
        
        <div 
          ref={scrollContainer}
          className="flex space-x-4 overflow-x-auto scrollbar-hide px-6 pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {scenarios.map((scenario) => (
            <div key={scenario.id} className="flex-shrink-0 w-64">
              <ScenarioCard
                scenario={scenario}
                difficultyColors={difficultyColors}
                onDelete={handleDeleteScenario}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-900/20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-red-400 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-900/20 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 text-lg mb-4">{error}</p>
            <Button onClick={loadScenarios} variant="outline">Retry</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-900/20">
        {/* Mobile App Header */}
        <div className="md:hidden border-b border-red-500/30 px-6 py-4 fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-white text-xl font-semibold">Audio<span className="text-red-500">VR</span></span>
            </div>
            <h1 className="absolute left-1/2 transform -translate-x-1/2 text-white text-xl font-semibold">Mystery Worlds</h1>
            <div></div>
          </div>
        </div>
        
        {/* Hero Section */}
        <div className="relative pt-20 md:pt-8 pb-8">
          <div className="px-6 md:px-8 lg:px-10">
            <div className="mb-6 md:mb-8">
              <h1 className="text-2xl md:text-4xl font-bold text-white text-glow mb-2">
                Mystery Worlds
              </h1>
              <p className="text-gray-300 text-sm md:text-base mb-6">
                Explore immersive voice adventures and solve mysteries in different worlds
              </p>
              
              {/* Search Bar and Create Button */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="max-w-md flex-1">
                  <Input
                    placeholder="Search mystery worlds..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<Search className="h-5 w-5" />}
                    fullWidth
                    className="bg-black/30 border-red-500/30"
                  />
                </div>
                <Button
                  onClick={() => navigate('/role-plays/create')}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 cinematic-glow"
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Create Role-Play
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Netflix-style Sections */}
        <div className="space-y-8 pb-20 md:pb-8">
          {filteredScenarios.length === 0 ? (
            <div className="text-center py-12 px-6">
              <p className="text-gray-300 text-lg mb-4">
                {searchTerm ? 'No mystery worlds match your search.' : 'No mystery worlds found.'}
              </p>
              {searchTerm && (
                <Button
                  variant="outline"
                  onClick={() => setSearchTerm('')}
                  className="mb-4"
                >
                  Clear Search
                </Button>
              )}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="outline"
                  onClick={loadScenarios}
                  className="backdrop-blur-sm bg-white/10"
                >
                  Refresh
                </Button>
                <Button
                  onClick={() => navigate('/role-plays/create')}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 cinematic-glow"
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Create Role-Play
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* First Mystery Worlds Row */}
              {filteredScenarios.length > 0 && (
                <ScrollableRow
                  title="Mystery Worlds"
                 scenarios={filteredScenarios.slice(0, Math.ceil(filteredScenarios.length / 2))}
                  sectionId="mystery-worlds-1"
                />
              )}

              {/* Second Mystery Worlds Row */}
              {filteredScenarios.length > 0 && (
                <ScrollableRow
                  title="Mystery Worlds"
                 scenarios={filteredScenarios.slice(Math.ceil(filteredScenarios.length / 2))}
                  sectionId="mystery-worlds-2"
                />
              )}

              {/* Popular Mystery Worlds */}
              {filteredGroupedScenarios['intermediate'] && filteredGroupedScenarios['intermediate'].length > 0 && (
                <ScrollableRow
                  title="Popular Mystery Worlds"
                  scenarios={filteredGroupedScenarios['intermediate']}
                  sectionId="popular"
                />
              )}

              {/* Show all scenarios if no specific difficulty grouping */}
              {!filteredGroupedScenarios['beginner'] && !filteredGroupedScenarios['intermediate'] && filteredScenarios.length > 0 && (
                <ScrollableRow
                  title="All Mystery Worlds"
                  scenarios={filteredScenarios}
                  sectionId="all"
                />
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </Layout>
  );
};