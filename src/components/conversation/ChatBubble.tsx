import React from 'react';
import { motion } from 'framer-motion';
import { User, Bot } from 'lucide-react';
import { format } from 'date-fns';

interface ChatBubbleProps {
  message: string;
  speaker: 'user' | 'agent';
  timestamp: Date;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, speaker, timestamp }) => {
  const isUser = speaker === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`flex items-start space-x-2 max-w-[80%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-primary-500 text-white' 
            : 'bg-secondary-500 text-white'
        }`}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-4 py-2 rounded-2xl shadow-sm ${
            isUser
              ? 'bg-primary-500 text-white rounded-br-md'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
          }`}>
            <p className="text-sm leading-relaxed">{message}</p>
          </div>
          
          {/* Timestamp */}
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-1">
            {format(timestamp, 'HH:mm')}
          </span>
        </div>
      </div>
    </motion.div>
  );
};