import React from 'react';
import { format } from 'date-fns';
import { Calendar, Edit, Trash2, Mail, MessageSquare, PlayCircle, Tag, Shield } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface Session {
  id: string;
  scenario_id: string;
  user_id: string;
  start_time: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  scenario: {
    title: string;
    description: string;
    difficulty: string;
    tags?: string[];
  };
  user: {
    first_name: string;
    last_name: string;
    avatar_url: string;
    role: string;
  } | null;
}

interface SessionCardProps {
  session: Session;
  onEdit: (session: Session) => void;
  onDelete: (session: Session) => void;
  onResendInvite: (session: Session) => void;
  getStatusBadge: (status: string) => JSX.Element;
  getDifficultyColor: (difficulty: string) => string;
  getRoleColor: (role: string) => string;
  isSendingEmail: boolean;
  sendingEmailForSessionId: string | null;
}

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  onEdit,
  onDelete,
  onResendInvite,
  getStatusBadge,
  getDifficultyColor,
  getRoleColor,
  isSendingEmail,
  sendingEmailForSessionId
}) => {
  const navigate = useNavigate();

  const handleTextChat = () => {
    navigate(`/practice/text/${session.scenario_id}`);
  };

  const handleVoiceChat = () => {
    navigate(`/practice/voice/${session.scenario_id}`);
  };

  // Provide fallback values for when user is null
  const userName = session.user 
    ? `${session.user.first_name} ${session.user.last_name}` 
    : 'Unknown User';
  const userRole = session.user?.role || 'employee';
  const userAvatarUrl = session.user?.avatar_url || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card className="h-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
        <div className="relative">
          <div className="absolute top-0 left-0 w-full h-16 md:h-24 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 dark:from-primary-900/30 dark:to-secondary-900/30"></div>
          
          <div className="absolute top-2 md:top-4 right-2 md:right-4 flex space-x-1 md:space-x-2 z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(session);
              }}
              className="p-1 md:p-1.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg"
            >
              <Edit className="h-3 w-3 md:h-4 md:w-4 text-gray-600 dark:text-gray-400" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(session);
              }}
              className="p-1 md:p-1.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg"
            >
              <Trash2 className="h-3 w-3 md:h-4 md:w-4 text-error-500" />
            </Button>
          </div>
        </div>
        
        <div className="p-4 md:p-6 pt-12 md:pt-16 flex-grow flex flex-col">
          <div className="flex items-center space-x-4 mb-4">
            <Avatar
              src={userAvatarUrl}
              name={userName}
              size="md"
              className="ring-4 ring-primary-500/20 dark:ring-primary-500/10"
            />
            <div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                {userName}
              </h3>
              <div className="flex items-center mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(userRole)}`}>
                  <Shield className="h-2.5 w-2.5 md:h-3 md:w-3 mr-1" />
                  {userRole}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">
              {session.scenario.title}
            </h4>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {session.scenario.description}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-1.5 md:gap-2 mb-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(session.scenario.difficulty)}`}>
              {session.scenario.difficulty}
            </span>
            
            {getStatusBadge(session.status)}
            
            {session.scenario.tags && session.scenario.tags.slice(0, 1).map((tag: string, index: number) => (
              <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-200">
                <Tag className="h-2.5 w-2.5 md:h-3 md:w-3 mr-1" />
                {tag}
              </span>
            ))}
          </div>
          
          <div className="flex items-center justify-center mb-4 md:mb-6 p-2 md:p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
            <div className="flex items-center text-xs md:text-sm text-gray-500 dark:text-gray-400">
              <Calendar className="h-3 w-3 md:h-4 md:w-4 mr-2" />
              {format(new Date(session.start_time), 'MMMM d, yyyy')}
            </div>
          </div>
          
          <div className="mt-auto">
            {session.status === 'pending' && (
              <Button
                variant="outline"
                size="sm"
                className="w-full border-secondary-300 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-900/20"
                leftIcon={<Mail className="h-4 w-4" />}
                onClick={(e) => {
                  e.stopPropagation();
                  onResendInvite(session);
                }}
                isLoading={isSendingEmail && sendingEmailForSessionId === session.id}
              >
                Resend Invite
              </Button>
            )}
            {session.status === 'accepted' && (
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 font-medium text-xs md:text-sm"
                  onClick={handleTextChat}
                >
                  <div className="flex items-center justify-center w-full">
                    <MessageSquare className="h-3 w-3 md:h-4 md:w-4 mr-2 text-primary-500 dark:text-primary-400" />
                    <span>Text Chat</span>
                  </div>
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-medium text-xs md:text-sm"
                  onClick={handleVoiceChat}
                >
                  <div className="flex items-center justify-center w-full">
                    <PlayCircle className="h-3 w-3 md:h-4 md:w-4 mr-2 animate-pulse" />
                    <span>Voice Chat</span>
                  </div>
                </Button>
              </div>
            )}
            {session.status === 'declined' && (
              <Button
                variant="outline"
                size="sm"
                className="w-full hover:bg-gray-50 dark:hover:bg-gray-700/50 text-xs md:text-sm"
                leftIcon={<Calendar className="h-4 w-4" />}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(session);
                }}
              >
                Reschedule
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};