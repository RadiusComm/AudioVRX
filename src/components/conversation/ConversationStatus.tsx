import React from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, Mic, MicOff, Volume2 } from 'lucide-react';

interface ConversationStatusProps {
  status: 'connected' | 'connecting' | 'disconnected' | 'listening' | 'speaking';
  isMuted?: boolean;
}

export const ConversationStatus: React.FC<ConversationStatusProps> = ({ status, isMuted }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: Wifi,
          text: 'Connected',
          color: 'text-green-500',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          pulse: false
        };
      case 'connecting':
        return {
          icon: Wifi,
          text: 'Connecting...',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
          pulse: true
        };
      case 'listening':
        return {
          icon: Mic,
          text: 'Listening',
          color: 'text-blue-500',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          pulse: true
        };
      case 'speaking':
        return {
          icon: Volume2,
          text: 'Speaking',
          color: 'text-purple-500',
          bgColor: 'bg-purple-100 dark:bg-purple-900/30',
          pulse: true
        };
      default:
        return {
          icon: WifiOff,
          text: 'Disconnected',
          color: 'text-gray-500',
          bgColor: 'bg-gray-100 dark:bg-gray-900/30',
          pulse: false
        };
    }
  };

  const config = getStatusConfig();
  const Icon = isMuted ? MicOff : config.icon;

  return (
    <div className={`inline-flex items-center px-3 py-1.5 rounded-full ${config.bgColor} border border-gray-200 dark:border-gray-600`}>
      <motion.div
        animate={config.pulse ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 1.5, repeat: config.pulse ? Infinity : 0 }}
        className="flex items-center"
      >
        <Icon className={`h-4 w-4 mr-2 ${isMuted ? 'text-red-500' : config.color}`} />
        <span className={`text-sm font-medium ${isMuted ? 'text-red-600 dark:text-red-400' : config.color}`}>
          {isMuted ? 'Muted' : config.text}
        </span>
      </motion.div>
    </div>
  );
};