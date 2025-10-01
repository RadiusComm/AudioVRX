import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '../components/layout/Layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { 
  Search, 
  RefreshCw, 
  Download, 
  FileText, 
  AlertCircle, 
  BarChart2, 
  Calendar, 
  Clock, 
  ArrowUpDown,
  ChevronDown,
  Eye,
  ChevronLeft,
  ChevronRight,
  Menu
} from 'lucide-react';

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
    objection_handling?: {
      score: number;
      summary: string;
    };
    insights: {
      agent_specific_advice: string;
    } | string;
  };
  created_at: string;
  transcript: string;
  user_id?: string;
  scenario_id?: string;
}

export const RolePlayAnalytics = () => {
  const [callAnalyses, setCallAnalyses] = useState<CallAnalysis[]>([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState<CallAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedAnalysis, setSelectedAnalysis] = useState<CallAnalysis | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{start: string; end: string}>({
    start: '',
    end: ''
  });
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadCallAnalyses();
  }, []);

  useEffect(() => {
    filterAnalyses();
  }, [callAnalyses, searchTerm, dateRange, sortField, sortDirection]);

  const loadCallAnalyses = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('call_analysis')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCallAnalyses(data || []);
    } catch (err: any) {
      console.error('Error loading call analyses:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAnalyses = () => {
    let filtered = [...callAnalyses];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(analysis => 
        analysis.agent_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analysis.conversation_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply date range filter
    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      filtered = filtered.filter(analysis => new Date(analysis.created_at) >= startDate);
    }

    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(analysis => new Date(analysis.created_at) <= endDate);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let valueA, valueB;

      switch (sortField) {
        case 'agent_id':
          valueA = a.agent_id;
          valueB = b.agent_id;
          break;
        case 'conversation_id':
          valueA = a.conversation_id;
          valueB = b.conversation_id;
          break;
        case 'score':
          valueA = getAverageScore(a.analysis);
          valueB = getAverageScore(b.analysis);
          break;
        case 'created_at':
        default:
          valueA = new Date(a.created_at).getTime();
          valueB = new Date(b.created_at).getTime();
          break;
      }

      if (sortDirection === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

    setFilteredAnalyses(filtered);
    setTotalPages(Math.ceil(filtered.length / recordsPerPage));
    
    // Reset to first page if current page is now invalid
    if (currentPage > Math.ceil(filtered.length / recordsPerPage)) {
      setCurrentPage(1);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getAverageScore = (analysis: CallAnalysis['analysis']) => {
    if (!analysis) return 0;
    
    const scores = [
      analysis.empathy?.score ?? 0,
      analysis.problem_solving?.score ?? 0,
      analysis.negotiation?.score ?? 0,
      analysis.active_listening?.score ?? 0,
      analysis.product_knowledge?.score ?? 0,
      analysis.technical_knowledge?.score ?? 0,
      analysis.objection_handling?.score ?? 0
    ];
    
    // Filter out zero scores
    const validScores = scores.filter(s => s > 0);
    
    // Return 0 if no valid scores
    if (validScores.length === 0) return 0;
    
    // Calculate average of valid scores
    return Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success-600 dark:text-success-400';
    if (score >= 60) return 'text-warning-600 dark:text-warning-400';
    return 'text-error-600 dark:text-error-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-success-100 dark:bg-success-900/30';
    if (score >= 60) return 'bg-warning-100 dark:bg-warning-900/30';
    return 'bg-error-100 dark:bg-error-900/30';
  };

  const renderInsights = (insights: any) => {
    if (typeof insights === 'string') {
      return insights;
    }
    return insights?.agent_specific_advice ?? 'No insights available';
  };

  const downloadTranscript = (analysis: CallAnalysis) => {
    if (!analysis.transcript) return;
    
    const element = document.createElement('a');
    const file = new Blob([analysis.transcript], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `transcript-${analysis.conversation_id}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Get paginated data
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredAnalyses.slice(indexOfFirstRecord, indexOfLastRecord);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Mobile App Header */}
        <div className="md:hidden border-b border-blue-700 px-6 py-4 fixed top-0 left-0 right-0 z-50" style={{ backgroundColor: 'rgb(32, 59, 118)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-white text-xl font-semibold">RetailIQ</span>
            </div>
            <h1 className="absolute left-1/2 transform -translate-x-1/2 text-white text-xl font-semibold">Analytics</h1>
            <button 
              onClick={() => setIsMobileSearchOpen(true)}
              className="p-1 rounded-full hover:bg-blue-800 transition-colors duration-200"
            >
              <Search className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>
        
        <div className="h-full py-6 md:py-8 px-4 sm:px-6 lg:px-6 overflow-y-auto pb-8 md:pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 pt-16 md:pt-0"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center mb-8 hidden md:flex">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400">
                    Role-Play Analytics
                  </h1>
                  <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                    View and analyze call performance data
                  </p>
                </div>
              </div>
            </div>

            <Card className="mb-8 hidden md:block">
              <CardContent className="p-6">
                <div className="flex flex-col space-y-4 xl:grid xl:grid-cols-3 xl:gap-4 xl:space-y-0">
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Search
                    </label>
                    <Input
                      placeholder="Search by agent ID or conversation ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      leftIcon={<Search className="h-5 w-5" />}
                      fullWidth
                    />
                  </div>
                  
                  <div className="col-span-1 xl:col-span-1">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Date Range
                    </label>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                      <div className="flex-1">
                        <Input
                          type="date"
                          value={dateRange.start}
                          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                          leftIcon={<Calendar className="h-5 w-5" />}
                          fullWidth
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          type="date"
                          value={dateRange.end}
                          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                          leftIcon={<Calendar className="h-5 w-5" />}
                          fullWidth
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-span-1 flex justify-start xl:justify-end items-end">
                    <Button
                      variant="outline"
                      onClick={loadCallAnalyses}
                      leftIcon={<RefreshCw className="h-4 w-4" />}
                      className="w-full sm:w-auto"
                    >
                      Refresh Data
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Call Analysis Records</CardTitle>
                <CardDescription>
                  {filteredAnalyses.length} record{filteredAnalyses.length !== 1 ? 's' : ''} found
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : error ? (
                  <div className="flex items-center p-4 text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-900/50 rounded-lg">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    {error}
                  </div>
                ) : filteredAnalyses.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
                      No call analysis records found
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort('agent_id')}
                          >
                            <div className="flex items-center">
                              Agent ID
                              {sortField === 'agent_id' && (
                                <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
                              )}
                            </div>
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort('conversation_id')}
                          >
                            <div className="flex items-center">
                              Conversation ID
                              {sortField === 'conversation_id' && (
                                <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
                              )}
                            </div>
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort('score')}
                          >
                            <div className="flex items-center">
                              Avg. Score
                              {sortField === 'score' && (
                                <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
                              )}
                            </div>
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort('created_at')}
                          >
                            <div className="flex items-center">
                              Date
                              {sortField === 'created_at' && (
                                <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
                              )}
                            </div>
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {currentRecords.map((analysis) => {
                          const avgScore = getAverageScore(analysis.analysis);
                          return (
                            <tr
                              key={analysis.id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 cursor-pointer"
                              onClick={() => {
                                setSelectedAnalysis(analysis);
                                setIsDetailModalOpen(true);
                              }}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {analysis.agent_id.substring(0, 8)}...
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {analysis.conversation_id.substring(0, 8)}...
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreBgColor(avgScore)} ${getScoreColor(avgScore)}`}>
                                  {avgScore}/100
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {format(new Date(analysis.created_at), 'MMM d, yyyy h:mm a')}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedAnalysis(analysis);
                                      setIsTranscriptModalOpen(true);
                                    }}
                                    className="p-1"
                                  >
                                    <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (analysis.transcript) {
                                        downloadTranscript(analysis);
                                      }
                                    }}
                                    className="p-1"
                                  >
                                    <Download className="h-4 w-4 text-primary-500 dark:text-primary-400" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedAnalysis(analysis);
                                      setIsDetailModalOpen(true);
                                    }}
                                    className="p-1"
                                  >
                                    <Eye className="h-4 w-4 text-secondary-500 dark:text-secondary-400" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
              {filteredAnalyses.length > 0 && (
                <CardFooter className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-6 py-4">
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Showing <span className="font-medium">{indexOfFirstRecord + 1}</span> to{" "}
                    <span className="font-medium">
                      {Math.min(indexOfLastRecord, filteredAnalyses.length)}
                    </span>{" "}
                    of <span className="font-medium">{filteredAnalyses.length}</span> records
                  </div>
                  <div className="flex space-x-1 sm:space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevPage}
                      disabled={currentPage === 1}
                      className="px-2 sm:px-3"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="hidden sm:flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "primary" : "outline"}
                            size="sm"
                            onClick={() => paginate(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    {/* Mobile page indicator */}
                    <div className="sm:hidden flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                      {currentPage} / {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextPage}
                      disabled={currentPage === totalPages}
                      className="px-2 sm:px-3"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="hidden md:flex items-center space-x-2">
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Records per page:</span>
                    <select
                      value={recordsPerPage}
                      onChange={(e) => {
                        setRecordsPerPage(Number(e.target.value));
                        setCurrentPage(1); // Reset to first page when changing items per page
                      }}
                      className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-1 px-2 text-xs sm:text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </CardFooter>
              )}
            </Card>

            {/* Mobile Search Modal */}
            <Modal
              isOpen={isMobileSearchOpen}
              onClose={() => setIsMobileSearchOpen(false)}
              title="Search & Filter"
            >
              <div className="space-y-6 p-6">
                <div className="space-y-4">
                  <div className="w-full">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Search
                    </label>
                    <Input
                      placeholder="Search by agent ID or conversation ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      leftIcon={<Search className="h-5 w-5" />}
                      fullWidth
                    />
                  </div>
                  
                  <div className="w-full">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Date Range
                    </label>
                    <div className="space-y-2">
                      <Input
                        type="date"
                        placeholder="Start date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        leftIcon={<Calendar className="h-5 w-5" />}
                        fullWidth
                      />
                      <Input
                        type="date"
                        placeholder="End date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        leftIcon={<Calendar className="h-5 w-5" />}
                        fullWidth
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setDateRange({ start: '', end: '' });
                    }}
                  >
                    Clear Filters
                  </Button>
                  <Button
                    onClick={() => setIsMobileSearchOpen(false)}
                    className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </Modal>

            {/* Analysis Detail Modal */}
            <Modal
              isOpen={isDetailModalOpen}
              onClose={() => {
                setIsDetailModalOpen(false);
                setSelectedAnalysis(null);
              }}
              title="Call Analysis Details"
            >
              {selectedAnalysis && (
                <div className="space-y-6 p-6 max-h-[80vh] overflow-y-auto">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        Analysis Summary
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(selectedAnalysis.created_at), 'MMMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (selectedAnalysis.transcript) {
                            downloadTranscript(selectedAnalysis);
                          }
                        }}
                        leftIcon={<Download className="h-4 w-4" />}
                      >
                        Download Transcript
                      </Button>
                    </div>
                  </div>

                  {/* Overall Score Circle */}
                  <div className="flex flex-col items-center justify-center mb-6">
                    <div className="relative w-32 h-32">
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
                        {/* Progress circle */}
                        <circle 
                          cx="50" 
                          cy="50" 
                          r="45" 
                          fill="none" 
                          stroke="#3B82F6" 
                          strokeWidth="8" 
                          strokeDasharray={`${2 * Math.PI * 45}`} 
                          strokeDashoffset={`${2 * Math.PI * 45 * (1 - getAverageScore(selectedAnalysis.analysis) / 100)}`} 
                          strokeLinecap="round" 
                          transform="rotate(-90 50 50)" 
                          className="dark:stroke-primary-400"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">{getAverageScore(selectedAnalysis.analysis)}</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mt-2 text-gray-900 dark:text-white">Overall Score</h3>
                  </div>

                  {/* Key Insights */}
                  <div className="bg-gradient-to-r from-accent-50 to-secondary-50 dark:from-accent-900/50 dark:to-secondary-900/50 rounded-lg p-6 border border-accent-100 dark:border-accent-800 shadow-md">
                    <h4 className="text-md font-semibold mb-2 flex items-center text-gray-900 dark:text-white">
                      <BarChart2 className="h-4 w-4 mr-2 text-primary-500" />
                      Key Insights & Recommendations
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                      {renderInsights(selectedAnalysis.analysis.insights)}
                    </p>
                  </div>

                  {/* Individual Scores */}
                  <div className="space-y-4">
                    {selectedAnalysis.analysis.active_listening && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium flex items-center text-gray-700 dark:text-gray-300">
                            <span className="inline-block w-3 h-3 bg-primary-500 rounded-full mr-2"></span>
                            Active Listening
                          </span>
                          <span className={`text-sm font-semibold ${getScoreColor(selectedAnalysis.analysis.active_listening.score || 0)}`}>
                            {selectedAnalysis.analysis.active_listening.score || 0}/100
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div 
                            className="bg-primary-500 h-2.5 rounded-full transition-all duration-500" 
                            style={{ width: `${selectedAnalysis.analysis.active_listening.score || 0}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedAnalysis.analysis.active_listening.summary || 'No active listening analysis available'}
                        </p>
                      </div>
                    )}

                    {selectedAnalysis.analysis.empathy && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium flex items-center text-gray-700 dark:text-gray-300">
                            <span className="inline-block w-3 h-3 bg-secondary-500 rounded-full mr-2"></span>
                            Empathy
                          </span>
                          <span className={`text-sm font-semibold ${getScoreColor(selectedAnalysis.analysis.empathy.score || 0)}`}>
                            {selectedAnalysis.analysis.empathy.score || 0}/100
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div 
                            className="bg-secondary-500 h-2.5 rounded-full transition-all duration-500" 
                            style={{ width: `${selectedAnalysis.analysis.empathy.score || 0}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedAnalysis.analysis.empathy.summary || 'No empathy analysis available'}
                        </p>
                      </div>
                    )}

                    {selectedAnalysis.analysis.problem_solving && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium flex items-center text-gray-700 dark:text-gray-300">
                            <span className="inline-block w-3 h-3 bg-accent-500 rounded-full mr-2"></span>
                            Problem Solving
                          </span>
                          <span className={`text-sm font-semibold ${getScoreColor(selectedAnalysis.analysis.problem_solving.score || 0)}`}>
                            {selectedAnalysis.analysis.problem_solving.score || 0}/100
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div 
                            className="bg-accent-500 h-2.5 rounded-full transition-all duration-500" 
                            style={{ width: `${selectedAnalysis.analysis.problem_solving.score || 0}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedAnalysis.analysis.problem_solving.summary || 'No problem solving analysis available'}
                        </p>
                      </div>
                    )}

                    {selectedAnalysis.analysis.negotiation && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium flex items-center text-gray-700 dark:text-gray-300">
                            <span className="inline-block w-3 h-3 bg-success-500 rounded-full mr-2"></span>
                            Negotiation
                          </span>
                          <span className={`text-sm font-semibold ${getScoreColor(selectedAnalysis.analysis.negotiation.score || 0)}`}>
                            {selectedAnalysis.analysis.negotiation.score || 0}/100
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div 
                            className="bg-success-500 h-2.5 rounded-full transition-all duration-500" 
                            style={{ width: `${selectedAnalysis.analysis.negotiation.score || 0}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedAnalysis.analysis.negotiation.summary || 'No negotiation analysis available'}
                        </p>
                      </div>
                    )}

                    {selectedAnalysis.analysis.product_knowledge && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium flex items-center text-gray-700 dark:text-gray-300">
                            <span className="inline-block w-3 h-3 bg-warning-500 rounded-full mr-2"></span>
                            Product Knowledge
                          </span>
                          <span className={`text-sm font-semibold ${getScoreColor(selectedAnalysis.analysis.product_knowledge.score || 0)}`}>
                            {selectedAnalysis.analysis.product_knowledge.score || 0}/100
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div 
                            className="bg-warning-500 h-2.5 rounded-full transition-all duration-500" 
                            style={{ width: `${selectedAnalysis.analysis.product_knowledge.score || 0}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedAnalysis.analysis.product_knowledge.summary || 'No product knowledge analysis available'}
                        </p>
                      </div>
                    )}

                    {selectedAnalysis.analysis.technical_knowledge && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium flex items-center text-gray-700 dark:text-gray-300">
                            <span className="inline-block w-3 h-3 bg-error-500 rounded-full mr-2"></span>
                            Technical Knowledge
                          </span>
                          <span className={`text-sm font-semibold ${getScoreColor(selectedAnalysis.analysis.technical_knowledge.score || 0)}`}>
                            {selectedAnalysis.analysis.technical_knowledge.score || 0}/100
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div 
                            className="bg-error-500 h-2.5 rounded-full transition-all duration-500" 
                            style={{ width: `${selectedAnalysis.analysis.technical_knowledge.score || 0}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedAnalysis.analysis.technical_knowledge.summary || 'No technical knowledge analysis available'}
                        </p>
                      </div>
                    )}

                    {selectedAnalysis.analysis.objection_handling && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium flex items-center text-gray-700 dark:text-gray-300">
                            <span className="inline-block w-3 h-3 bg-primary-300 rounded-full mr-2"></span>
                            Objection Handling
                          </span>
                          <span className={`text-sm font-semibold ${getScoreColor(selectedAnalysis.analysis.objection_handling.score || 0)}`}>
                            {selectedAnalysis.analysis.objection_handling.score || 0}/100
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div 
                            className="bg-primary-300 h-2.5 rounded-full transition-all duration-500" 
                            style={{ width: `${selectedAnalysis.analysis.objection_handling.score || 0}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedAnalysis.analysis.objection_handling.summary || 'No objection handling analysis available'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        setSelectedAnalysis(null);
                      }}
                    >
                      Close
                    </Button>
                    <Button
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        setIsTranscriptModalOpen(true);
                      }}
                      leftIcon={<FileText className="h-4 w-4" />}
                    >
                      View Transcript
                    </Button>
                  </div>
                </div>
              )}
            </Modal>

            {/* Transcript Modal */}
            <Modal
              isOpen={isTranscriptModalOpen}
              onClose={() => {
                setIsTranscriptModalOpen(false);
              }}
              title="Conversation Transcript"
            >
              {selectedAnalysis && (
                <div className="space-y-4 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(selectedAnalysis.created_at), 'MMMM d, yyyy h:mm a')}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Agent ID: {selectedAnalysis.agent_id}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Conversation ID: {selectedAnalysis.conversation_id}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (selectedAnalysis.transcript) {
                          downloadTranscript(selectedAnalysis);
                        }
                      }}
                      leftIcon={<Download className="h-4 w-4" />}
                    >
                      Download
                    </Button>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">
                      {selectedAnalysis.transcript || 'No transcript available'}
                    </pre>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsTranscriptModalOpen(false);
                      }}
                    >
                      Close
                    </Button>
                    <Button
                      onClick={() => {
                        setIsTranscriptModalOpen(false);
                        setIsDetailModalOpen(true);
                      }}
                      leftIcon={<BarChart2 className="h-4 w-4" />}
                    >
                      View Analysis
                    </Button>
                  </div>
                </div>
              )}
            </Modal>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};