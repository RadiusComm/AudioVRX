import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, BarChart3, Tag, PlayCircle, MessageSquare, Pencil, Trash2, AlertCircle, Edit, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Dropdown } from '../ui/Dropdown';
import { ScenarioDifficulty } from '../../types';
import { supabase } from '../../lib/supabase';

interface ScenarioCardProps {
  scenario: {
    id: string;
    title: string;
    description: string;
    difficulty: ScenarioDifficulty;
    estimated_time: string;
    completion_rate: number;
    tags: string[];
    cover_image_url: string;
    persona_id?: string;
  };
  difficultyColors: Record<ScenarioDifficulty, string>;
  onDelete?: () => void;
}

interface RolePlayAgent {
  id: string;
  type: 'text' | 'voice';
  scenario_id: string;
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenario, difficultyColors, onDelete }) => {
  const navigate = useNavigate();
  const [textAgent, setTextAgent] = useState<RolePlayAgent | null>(null);
  const [voiceAgent, setVoiceAgent] = useState<RolePlayAgent | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    loadRolePlayAgents();
    checkUserRole();
  }, [scenario.id]);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      setIsAdmin(profile.role === 'admin' || profile.role === 'super-admin');
    } catch (err) {
      console.error('Error checking user role:', err);
    }
  };

  const loadRolePlayAgents = async () => {
    try {
      const { data: agents, error } = await supabase
        .from('role_play_agents')
        .select('*')
        .eq('scenario_id', scenario.id);

      if (error) throw error;

      if (agents) {
        const textAgent = agents.find(agent => agent.type === 'text');
        const voiceAgent = agents.find(agent => agent.type === 'voice');
        
        setTextAgent(textAgent || null);
        setVoiceAgent(voiceAgent || null);
      }
    } catch (err) {
      console.error('Error loading role-play agents:', err);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-scenario`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: scenario.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete scenario');
      }

      setIsDeleteModalOpen(false);
      onDelete?.();
    } catch (err: any) {
      console.error('Error deleting scenario:', err);
      setError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTextChat = () => {
    navigate(`/practice/text/${scenario.id}`);
  };

  const handleVoiceChat = () => {
    navigate(`/practice/voice/${scenario.id}`);
  };

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.05 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="h-full group cursor-pointer"
      >
        <Card className="relative flex flex-col w-full aspect-[2/3] overflow-hidden bg-black/40 backdrop-blur-xl hover:shadow-2xl transition-all duration-500 rounded-lg shadow-2xl border border-red-500/20 cinematic-glow">
          {/* Full background image */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 opacity-90"
            style={{ 
              backgroundImage: `url(${scenario.cover_image_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 group-hover:from-black/70 transition-all duration-500" />
          
          {/* Admin controls */}
          {isAdmin && (
            <div className="absolute top-3 right-3 z-20">
              <Dropdown
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1.5 bg-black/60 backdrop-blur-sm rounded-full shadow-lg hover:bg-black/80 transition-all duration-200 border border-red-500/30"
                  >
                    <MoreVertical className="h-4 w-4 text-white" />
                  </Button>
                }
                items={[
                  {
                    label: 'Edit',
                    onClick: () => navigate(`/role-plays/${scenario.id}/edit`),
                    icon: <Edit className="h-4 w-4" />
                  },
                  {
                    label: 'Delete',
                    onClick: () => setIsDeleteModalOpen(true),
                    icon: <Trash2 className="h-4 w-4" />
                  }
                ]}
              />
            </div>
          )}
          
          {/* Difficulty badge */}
          <div className="absolute top-3 left-3 z-20">
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-red-600/90 backdrop-blur-sm text-white border border-red-400/50 shadow-lg">
              {scenario.difficulty}
            </span>
          </div>
          
          {/* Hover overlay with details */}
          <motion.div 
            className="absolute inset-0 z-10 bg-black/80 backdrop-blur-sm flex flex-col justify-center items-center p-4 opacity-0 group-hover:opacity-100 transition-all duration-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
          >
            <div className="text-center space-y-3">
              <h3 className="text-lg font-bold text-white leading-tight">
                {scenario.title}
              </h3>
              <p className="text-sm text-gray-300 line-clamp-3">
                {scenario.description}
              </p>
              
              {/* Action buttons */}
              <div className="flex space-x-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTextChat}
                  className="flex-1 bg-black/30 backdrop-blur-sm text-white border-red-500/30 hover:bg-red-500/20 transition-all duration-200"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Text
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold cinematic-glow"
                  onClick={handleVoiceChat}
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Voice
                </Button>
              </div>
            </div>
          </motion.div>
            
          {/* Title overlay - always visible */}
          <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/90 to-transparent">
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white leading-tight text-center group-hover:opacity-0 transition-opacity duration-300">
                {scenario.title}
              </h3>
            </div>
          </div>
        </Card>
      </motion.div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Scenario"
      >
        <div className="space-y-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-warning-500 mr-2" />
            <p className="text-gray-600 dark:text-gray-300">
              Are you sure you want to delete "{scenario.title}"? This action cannot be undone and will also delete all associated agents.
            </p>
          </div>
          
          {error && (
            <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
          )}
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="error"
              onClick={handleDelete}
              isLoading={isDeleting}
              leftIcon={<Trash2 className="h-4 w-4" />}
            >
              Delete Scenario
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};