import React, { useState, useEffect, useRef } from 'react';
import { useConversation } from '@elevenlabs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Phone, PhoneOff, Mic, MicOff } from 'lucide-react';
import { Button } from '../ui/Button';
import { ConversationStatus } from './ConversationStatus';
import { supabase } from '../../lib/supabase';

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  speaker: 'user' | 'agent';
}

interface ConversationInterfaceProps {
  agentId: string;
  scenarioId: string;
  onConversationEnd?: (transcript: Message[]) => void;
}

export const ConversationInterface: React.FC<ConversationInterfaceProps> = ({
  agentId,
  scenarioId,
  onConversationEnd
}) => {
  const [transcript, setTranscript] = useState<Message[]>([]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [conversationState, setConversationState] = useState<'idle' | 'active' | 'paused'>('idle');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    } catch (err) {
      console.error('Error getting current user:', err);
    }
  };

  const saveSessionRecord = async (conversationId: string) => {
    try {
      if (!currentUser?.id || !agentId || !scenarioId) {
        console.warn('Missing required data for session record:', { 
          userId: currentUser?.id, 
          agentId, 
          scenarioId 
        });
        return;
      }

      const { error } = await supabase
        .from('call_analysis')
        .insert([{
          user_id: currentUser.id,
          agent_id: agentId,
          scenario_id: scenarioId,
          conversation_id: conversationId,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Error saving session record:', error);
      } else {
        console.log('Session record saved successfully');
      }
    } catch (err) {
      console.error('Error in saveSessionRecord:', err);
    }
  };
  
  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to ElevenLabs');
      setError(null);
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs');
      setIsSessionActive(false);
      setConversationState('idle');
      
      // Call callback with transcript when disconnected
      if (onConversationEnd) {
        onConversationEnd(transcript);
      }
    },
    onMessage: (message) => {
      console.log('Message received:', message);
      
      // Add message to transcript
      const newMessage: Message = {
        id: Date.now().toString(),
        content: message.message || '',
        timestamp: new Date(),
        speaker: message.source === 'user' ? 'user' : 'agent'
      };
      
      setTranscript(prev => [...prev, newMessage]);
    },
    onError: (error) => {
      console.error('Conversation error:', error);
      setError(error.message || 'An error occurred during the conversation');
      
      // Reset states on error
      setIsSessionActive(false);
      setIsPaused(false);
    }
  });

  const getAgentSession = async () => {
    setIsLoadingSession(true);
    setError(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-agent-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agentId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get agent session');
      }

      const data = await response.json();
      return data.signedUrl;
    } catch (err: any) {
      console.error('Error getting agent session:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoadingSession(false);
    }
  };

  const startConversation = async () => {
    try {
      const signedUrl = await getAgentSession();
      
      const session = await conversation.startSession({
        signedUrl,
        connectionType: "websocket",
        agentId: agentId,
        userId: currentUser?.id,
        scenarioId: scenarioId
      });
      
      setIsSessionActive(true);
      setConversationId(session);
      
      // Save session record to database
      await saveSessionRecord(session);
      
      setConversationState('active');
      setTranscript([]); // Clear previous transcript
    } catch (err: any) {
      console.error('Error starting conversation:', err);
      setError(err.message);
    }
  };

  const toggleMute = () => {
    if (!isSessionActive || conversation.status !== 'connected') {
      console.warn('Cannot toggle mute: session not active or not connected');
      return;
    }
    
    try {
      if (conversation.isMuted) {
        conversation.unmute();
      } else {
        conversation.mute();
      }
    } catch (err: any) {
      console.error('Error toggling mute:', err);
      setError(err.message);
    }
  };

  const pauseConversation = async () => {
    try {
      if (isSessionActive && conversation.status === 'connected') {
        await conversation.endSession();
      }
      setConversationState('paused');
      setIsSessionActive(false);
      
      // Log transcript when pausing
      console.log('Conversation paused. Transcript:', transcript);
    } catch (err: any) {
      console.error('Error pausing conversation:', err);
      setError(err.message);
    }
  };

  const resumeConversation = async () => {
    try {
      const signedUrl = await getAgentSession();
  
      const session = await conversation.startSession({
        signedUrl,
        connectionType: "websocket",
        agentId: agentId,
        userId: currentUser?.id,
        scenarioId: scenarioId
      });
      
      setConversationState('active');
      setConversationId(session);
      
      // Save session record to database
      await saveSessionRecord(session);
      
      setIsSessionActive(true);
    } catch (err: any) {
      console.error('Error resuming conversation:', err);
      setError(err.message);
    }
  };

  const stopConversation = async () => {
    try {
      if (isSessionActive && conversation.status === 'connected') {
        await conversation.endSession();
      }
      
      // Log final transcript
      console.log('Conversation ended. Final transcript:', transcript);
      
      // Call callback with transcript
      if (onConversationEnd) {
        onConversationEnd(transcript);
      }
    } catch (err: any) {
      console.error('Error stopping conversation:', err);
      setError(err.message);
    } finally {
      // Always reset states even if there's an error
      setIsSessionActive(false);
      setConversationState('idle');
      setTranscript([]);
    }
  };

  const getConnectionStatus = () => {
    // Only show active states if both session is active and connection is established
    if (conversationState === 'active' && conversation.status === 'connected') {
      if (conversation.isSpeaking) return 'speaking';
      if (conversation.isListening) return 'listening';
      return 'connected';
    }
    if (conversation.status === 'connecting') return 'connecting';
    return 'disconnected';
  };

  // Disable buttons when connection is not stable
  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      {conversationState === 'idle' ? (
        <button 
          onClick={startConversation}
          disabled={isLoadingSession}
          className="w-full bg-purple-500 border-2 border-purple-500 rounded-xl py-4 px-6 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-600 transition-colors duration-200"
        >
          <div className="flex items-center justify-center">
            {isLoadingSession ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
            ) : (
              <Phone className="h-5 w-5 text-white mr-3" />
            )}
            <span className="text-white font-semibold text-lg">
              {isLoadingSession ? 'Connecting...' : 'Start Voice Call'}
            </span>
          </div>
        </button>
      ) : conversationState === 'active' ? (
        <button 
          onClick={pauseConversation}
          className="w-full bg-red-500 border-2 border-red-500 rounded-xl py-4 px-6 hover:bg-red-600 transition-colors duration-200"
        >
          <div className="flex items-center justify-center">
            <Pause className="h-5 w-5 text-white mr-3" />
            <span className="text-white font-semibold text-lg">
              Pause Call
            </span>
          </div>
        </button>
      ) : (
        <button 
          onClick={resumeConversation}
          disabled={isLoadingSession}
          className="w-full bg-blue-500 border-2 border-blue-500 rounded-xl py-4 px-6 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors duration-200"
        >
          <div className="flex items-center justify-center">
            {isLoadingSession ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
            ) : (
              <Play className="h-5 w-5 text-white mr-3" />
            )}
            <span className="text-white font-semibold text-lg">
              {isLoadingSession ? 'Connecting...' : 'Resume Call'}
            </span>
          </div>
        </button>
      )}
    </div>
  );
};