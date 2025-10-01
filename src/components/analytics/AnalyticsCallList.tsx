import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, AlertCircle, ChevronRight, Clock, BarChart, MessageCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

interface CallAnalysis {
  id: string;
  agent_id: string;
  conversation_id: string;
  analysis: {
    empathy?: {
      score: number;
      summary: string;
    };
    problem_solving?: {
      score: number;
      summary: string;
    };
    negotiation?: {
      score: number;
      summary: string;
    };
    product_knowledge?: {
      score: number;
      summary: string;
    };
    active_listening?: {
      score: number;
      summary: string;
    };
    technical_knowledge?: {
      score: number;
      summary: string;
    };
    insights: {
      agent_specific_advice: string;
    } | string;
  };
  created_at: string;
}

export const AnalyticsCallList = () => {
  const [calls, setCalls] = useState<CallAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCall, setSelectedCall] = useState<CallAnalysis | null>(null);

  useEffect(() => {
    loadCalls();
  }, []);

  const loadCalls = async () => {
    try {
      const { data, error } = await supabase
        .from('call_analysis')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCalls(data || []);
    } catch (err: any) {
      console.error('Error loading calls:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-success-600 dark:text-success-400';
    if (score >= 50) return 'text-warning-600 dark:text-warning-400';
    return 'text-error-600 dark:text-error-400';
  };

  const renderInsights = (insights: CallAnalysis['analysis']['insights']) => {
    if (typeof insights === 'string') {
      return insights;
    }
    return insights?.agent_specific_advice ?? 'No insights available';
  };

  const getAverageScore = (call: CallAnalysis) => {
    const scores = [
      call.analysis?.empathy?.score ?? 0,
      call.analysis?.problem_solving?.score ?? 0,
      call.analysis?.negotiation?.score ?? 0,
      call.analysis?.active_listening?.score ?? 0,
      call.analysis?.product_knowledge?.score ?? 0,
      call.analysis?.technical_knowledge?.score ?? 0
    ];
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const ScoreCard = ({ title, score, summary }: { title: string; score: number; summary: string }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border border-gray-100 dark:border-gray-700 group relative hover:shadow-lg transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h4>
        <div className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(score)}`}>
          {score}/100
        </div>
      </div>
      <div className="relative">
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">{summary}</p>
        {/* Tooltip */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute z-50 -top-2 left-0 right-0 bg-gray-800 text-white p-4 rounded-lg shadow-xl transform -translate-y-full pointer-events-none">
          {summary}
        </div>
      </div>
    </div>
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  };

  if (isLoading) {
    return (
      <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border border-primary-100/50 dark:border-primary-900/50 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border border-primary-100/50 dark:border-primary-900/50 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center text-error-600 dark:text-error-400">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border border-primary-100/50 dark:border-primary-900/50 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-xl bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400">Recent Call Analysis</CardTitle>
          <CardDescription>Performance insights from your recent conversations</CardDescription>
        </CardHeader>
        <CardContent>
          {calls.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No call analysis records found.</p>
            </div>
          ) : (
            <motion.div 
              className="max-h-[400px] overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {calls.map((call) => (
                <motion.div
                  key={call.id}
                  variants={itemVariants}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-all duration-200 border border-primary-50 dark:border-primary-900 group relative"
                  onClick={() => setSelectedCall(call)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-grow">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="h-4 w-4 mr-1" />
                          {format(new Date(call.created_at), 'MMM d, yyyy h:mm a')}
                        </div>
                        <div className="flex items-center">
                          <span className={`font-bold text-lg ${getScoreColor(getAverageScore(call))}`}>
                            {getAverageScore(call)}/100
                          </span>
                          <ChevronRight className="h-5 w-5 ml-2 text-gray-400 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors duration-200" />
                        </div>
                      </div>
                      <div className="relative">
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                          {renderInsights(call.analysis.insights)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Skill badges */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {call.analysis?.empathy && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-200">
                        Empathy: {call.analysis.empathy.score}%
                      </span>
                    )}
                    {call.analysis?.problem_solving && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800 dark:bg-secondary-900/50 dark:text-secondary-200">
                        Problem Solving: {call.analysis.problem_solving.score}%
                      </span>
                    )}
                    {call.analysis?.negotiation && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent-100 text-accent-800 dark:bg-accent-900/50 dark:text-accent-200">
                        Negotiation: {call.analysis.negotiation.score}%
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={!!selectedCall}
        onClose={() => setSelectedCall(null)}
        title="Call Analysis Details"
      >
        <div className="space-y-6 p-6 max-h-[80vh] overflow-y-auto">
          {selectedCall && (
            <>
              {/* Overall Score Card */}
              <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg p-6 text-white mb-8 shadow-lg">
                <h3 className="text-xl font-semibold mb-2">Overall Performance</h3>
                <div className="flex items-center justify-between">
                  <p className="text-primary-100">Average Score</p>
                  <div className="text-3xl font-bold">{getAverageScore(selectedCall)}%</div>
                </div>
                <div className="mt-4 w-full bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-white rounded-full h-2 transition-all duration-500"
                    style={{ width: `${getAverageScore(selectedCall)}%` }}
                  />
                </div>
              </div>

              {/* Performance Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <ScoreCard
                  title="Empathy"
                  score={selectedCall.analysis?.empathy?.score ?? 0}
                  summary={selectedCall.analysis?.empathy?.summary ?? 'No empathy analysis available'}
                />
                <ScoreCard
                  title="Problem Solving"
                  score={selectedCall.analysis?.problem_solving?.score ?? 0}
                  summary={selectedCall.analysis?.problem_solving?.summary ?? 'No problem solving analysis available'}
                />
                <ScoreCard
                  title="Negotiation"
                  score={selectedCall.analysis?.negotiation?.score ?? 0}
                  summary={selectedCall.analysis?.negotiation?.summary ?? 'No negotiation analysis available'}
                />
                <ScoreCard
                  title="Active Listening"
                  score={selectedCall.analysis?.active_listening?.score ?? 0}
                  summary={selectedCall.analysis?.active_listening?.summary ?? 'No active listening analysis available'}
                />
                <ScoreCard
                  title="Technical Knowledge"
                  score={selectedCall.analysis?.technical_knowledge?.score ?? 0}
                  summary={selectedCall.analysis?.technical_knowledge?.summary ?? 'No technical knowledge analysis available'}
                />
                <ScoreCard
                  title="Product Knowledge"
                  score={selectedCall.analysis?.product_knowledge?.score ?? 0}
                  summary={selectedCall.analysis?.product_knowledge?.summary ?? 'No product knowledge analysis available'}
                />
              </div>

              {/* Key Insights Section */}
              <div className="bg-gradient-to-r from-accent-50 to-secondary-50 dark:from-accent-900/50 dark:to-secondary-900/50 rounded-lg p-6 border border-accent-100 dark:border-accent-800 shadow-md">
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <BarChart className="h-6 w-6 mr-2 text-accent-500" />
                  Key Insights & Recommendations
                </h4>
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                    {renderInsights(selectedCall.analysis.insights)}
                  </p>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button 
                  onClick={() => setSelectedCall(null)}
                  className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                  leftIcon={<MessageCircle className="h-4 w-4" />}
                >
                  Start New Practice
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
};