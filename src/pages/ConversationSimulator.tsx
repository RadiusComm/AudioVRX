import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, MessageSquare, BarChart2, RotateCw, Mic } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { ConversationInterface } from '../components/conversation/ConversationInterface';
import { supabase } from '../lib/supabase';

export const ConversationSimulator = () => {
  const { type, scenarioId } = useParams<{ type: string; scenarioId: string }>();
  const navigate = useNavigate();
  const [scenario, setScenario] = useState<any>(null);
  const [agent, setAgent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    loadScenario();
  }, []);

  useEffect(() => {
    if (agent?.elevenlabs_agent_id) {
      loadLatestAnalysis();
    }
  }, [agent]);

  const loadLatestAnalysis = async () => {
    try {
      setIsRefreshing(true);
      const { data, error } = await supabase
        .from('call_analysis')
        .select('analysis, transcript')
        .eq('agent_id', agent?.elevenlabs_agent_id)
        .eq('user_id', currentUser?.id)
        .eq('scenario_id', scenarioId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setAnalysis(data.analysis);
      }
    } catch (err) {
      console.error('Error loading analysis:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadScenario = async () => {
    if (!scenarioId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUser(user);

    try {
      const { data: scenarioData, error: scenarioError } = await supabase
        .from('scenarios')
        .select('*')
        .eq('id', scenarioId)
        .single();

      if (scenarioError) throw scenarioError;
      setScenario(scenarioData);

      const { data: agentData, error: agentError } = await supabase
        .from('role_play_agents')
        .select('*')
        .eq('scenario_id', scenarioId)
        .eq('type', type)
        .maybeSingle();
      setAgent(agentData);
    } catch (err) {
      console.error('Error loading role-play:', err);
      setError('Failed to load role-play');
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return 'bg-green-500/90 text-white';
      case 'intermediate':
        return 'bg-yellow-500/90 text-white';
      case 'advanced':
        return 'bg-red-500/90 text-white';
      case 'expert':
        return 'bg-purple-500/90 text-white';
      default:
        return 'bg-gray-500/90 text-white';
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-400"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideFooter>
      {/* Desktop View */}
      <div className="hidden md:block min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start space-x-6">
              <Button
                variant="ghost"
                size="sm"
                className="mt-1"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 via-secondary-500 to-accent-500 dark:from-primary-400 dark:via-secondary-300 dark:to-accent-300 mb-2">
                  {scenario?.title}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 line-clamp-2 sm:line-clamp-none">
                  {scenario?.description}
                </p>
              </div>
            </div>
          </div>

          <div className="relative p-2 sm:p-4 md:p-8 bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/20 dark:border-gray-700/20 shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.25)] transition-all duration-500">
            {/* Decorative gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-800/85 via-transparent to-secondary-900/85 dark:from-primary-800/95 dark:to-secondary-800/95 rounded-xl sm:rounded-2xl" />
            
            {/* Content grid */}
            <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-4 md:gap-8">
              {/* Agent Card */}
              <Card className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm overflow-hidden border border-white/20 dark:border-gray-700/20 shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.25)] transition-all duration-500 h-[320px] sm:h-[500px] md:h-[600px]">
                <div className="relative p-2 sm:p-4 md:p-8 flex flex-col items-center justify-center h-full">
                  {/* Decorative gradient background */}
                  <div className="absolute inset-0 bg-[#ffffff] via-transparent to-secondary-500/5 dark:from-primary-500/10 dark:to-secondary-500/10" />
                  
                  {/* Avatar with enhanced styling */}
                  <div className="relative mb-3 sm:mb-6 md:mb-8">
                    <div className="absolute -inset-4 bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 rounded-full opacity-20 blur-xl animate-pulse" />
                    <Avatar
                      src={agent?.avatar_url}
                      name={agent?.name || 'AI Assistant'}
                      className="h-12 w-12 sm:h-24 sm:w-24 md:h-32 md:w-32 ring-2 sm:ring-4 ring-white/50 dark:ring-gray-800/50 shadow-xl transform hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  
                  {/* Agent name and role */}
                  <div className="text-center mb-3 sm:mb-6 md:mb-8">
                    <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
                      {agent?.role || 'Conversation Partner'}
                    </p>
                  </div>
                  
                  {/* Chat interface */}
                  <div className="w-full relative">
                    <elevenlabs-convai 
                      agent-id={agent?.elevenlabs_agent_id} 
                      dynamic-variables={`{"system_user_id": "${currentUser?.id}", "scenario_id": "${scenario?.id}"}`}
                    />
                  </div>
                </div>
              </Card>

              {/* Custom Conversation Interface */}
              <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-l border-gray-200 dark:border-gray-700 shadow-xl h-[320px] sm:h-[500px] md:h-[600px] flex flex-col">
                <div className="p-2 sm:p-4 md:p-6 flex-1 overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-sm sm:text-lg md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400">
                      Custom Conversation Interface
                    </h2>
                  </div>
                  <ConversationInterface
                    agentId={agent?.elevenlabs_agent_id || ''}
                    scenarioId={scenario?.id || ''}
                    onConversationEnd={(transcript) => {
                      console.log('Custom Interface - Conversation ended with transcript:', transcript);
                    }}
                  />
                </div>
              </Card>

              {/* Analysis Card */}
              <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-l border-gray-200 dark:border-gray-700 shadow-xl h-[320px] sm:h-[500px] md:h-[600px] flex flex-col">
                <div className="p-2 sm:p-4 md:p-6 flex-1 overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-sm sm:text-lg md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400">
                      Performance Analysis
                    </h2>
                  </div>

                  {/* Always show no score message initially */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-2 sm:p-4 md:p-6 rounded-lg border border-blue-100 dark:border-blue-800 max-w-md mx-auto mt-2 sm:mt-6 md:mt-8">
                    {/* No Score Circle */}
                    <div className="flex flex-col items-center justify-center mb-2 sm:mb-4">
                      <div className="relative w-12 h-12 sm:w-20 sm:h-20 md:w-24 md:h-24">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                          {/* Background circle */}
                          <circle 
                            cx="50" 
                            cy="50" 
                            r="45" 
                            fill="none" 
                            stroke="#e5e7eb" 
                            strokeWidth="8" 
                            className="dark:stroke-gray-700"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-400 dark:text-gray-500">--</span>
                        </div>
                      </div>
                      <h3 className="text-xs sm:text-base font-semibold mt-1 sm:mt-2 text-gray-900 dark:text-white">No Score Yet</h3>
                    </div>
                    
                    <p className="text-gray-700 dark:text-gray-300 text-center text-xs sm:text-sm md:text-base">
                      No score available yet. Please click the "Rate Role-Play" button after completing your conversation to get your performance analysis.
                    </p>
                  </div>

                </div>
                
                {/* Fixed Rate Roleplay Button at bottom */}
                <div className="p-2 sm:p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <div className="flex justify-center">
                    <button
                      onClick={loadLatestAnalysis}
                      disabled={isRefreshing}
                     className={`inline-flex items-center px-2.5 py-1 sm:px-4 sm:py-2 rounded-full text-black bg-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 shadow-xl shadow-gray-400/50 text-xs sm:text-base ${isRefreshing ? 'opacity-75 cursor-not-allowed' : ''}`}
                    >
                      {isRefreshing ? (
                        <RotateCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                      ) : (
                        <BarChart2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      )}
                     {isRefreshing ? 'Loading...' : 'Rate Role-Play'}
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden min-h-screen relative overflow-y-auto">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${scenario?.cover_image_url || 'https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'})`,
          }}
        />
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col min-h-screen pb-4">
          {/* Header */}
          <div className="flex items-center justify-between p-4 pt-12">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="p-2 bg-black/30 backdrop-blur-sm rounded-full border border-white/20"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </Button>
          </div>

          {/* Title */}
          <div className="px-6 mb-8">
            <h1 className="text-3xl font-bold text-white leading-tight">
              {scenario?.title || 'The Whitechapel Mystery'}
            </h1>
          </div>

          {/* Character Section */}
          <div className="px-6 mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar
                  src={agent?.avatar_url}
                  name={agent?.name || 'Detective'}
                  className="h-16 w-16 ring-2 ring-white/50 shadow-lg"
                />
                <div className="absolute -bottom-1 -right-1 bg-purple-500 rounded-full p-1">
                  <Play className="h-3 w-3 text-white" />
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${getDifficultyColor(scenario?.difficulty)}`}>
                    {scenario?.difficulty || '4/5'}
                  </span>
                  <span className="text-white/80 text-sm">DIFFICULTY</span>
                </div>
                
                <div className="text-white/60 text-sm">
                  <span className="font-medium">Detective</span>
                  <span className="mx-2">•</span>
                  <span>{scenario?.estimated_time || '45 min'}</span>
                </div>
                
                <div className="flex items-center mt-1">
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <div key={star} className="w-2 h-2 bg-yellow-400 rounded-full" />
                    ))}
                  </div>
                  <span className="text-white/60 text-xs ml-2">TOP EPISODES</span>
                </div>
              </div>
            </div>
          </div>

          {/* Case Difficulty Section */}
          <div className="px-6 mb-8">
            <h2 className="text-white text-lg font-semibold mb-3">Case Difficulty</h2>
            <p className="text-white/80 text-sm leading-relaxed">
              {scenario?.description || 'Core. Sanctorum/intectant aeso te spronges protiest. Tuchsame lontiso asomesee minicre. Imi ot mhiditling ini pormi\'oul ig naner ion are going pringe. Throe nice cimmer inforia nase imalt actimo illeas.'}
            </p>
          </div>

          {/* Bottom Action Buttons */}
          <div className="mt-auto px-6 pb-0 space-y-3">
            {/* Inbox/Messages Button */}
            <button className="w-full bg-transparent border-2 border-red-500 rounded-xl py-4 px-6">
              <div className="flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-red-500 mr-3" />
                <span className="text-red-500 font-semibold text-lg">Inbox / Messages</span>
              </div>
            </button>

            {/* Custom Conversation Interface */}
            <ConversationInterface
              agentId={agent?.elevenlabs_agent_id || ''}
              scenarioId={scenario?.id || ''}
              onConversationEnd={(transcript) => {
                console.log('Mobile Interface - Conversation ended with transcript:', transcript);
              }}
            />
          </div>

        </div>

      </div>
    </Layout>
  );
};