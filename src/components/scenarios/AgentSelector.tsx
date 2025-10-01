import React from 'react';
import { UserCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { GuidanceBubble } from './ScenarioBasicInfo';

interface Persona {
  id: string;
  name: string;
  role: string;
  company?: string;
  avatar_url?: string;
}

interface AgentSelectorProps {
  personas: Persona[];
  formData: {
    personaId: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  currentPage: number;
  totalPages: number;
  handlePreviousPage: (e: React.MouseEvent) => void;
  handleNextPage: (e: React.MouseEvent) => void;
  hasGeneratedContent: boolean;
  showAgentBubble: boolean;
  setShowAgentBubble: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({
  personas,
  formData,
  setFormData,
  currentPage,
  totalPages,
  handlePreviousPage,
  handleNextPage,
  hasGeneratedContent,
  showAgentBubble,
  setShowAgentBubble
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between relative">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <UserCircle className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
          Select IQ Agent
        </h3>
        <div className="hidden md:flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage === 0 || !hasGeneratedContent}
            className={!hasGeneratedContent ? 'opacity-50' : ''}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {currentPage + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages - 1 || !hasGeneratedContent}
            className={!hasGeneratedContent ? 'opacity-50' : ''}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <GuidanceBubble 
          show={showAgentBubble} 
          text="Select an IQ Agent to handle this role-play scenario."
          position="bottom"
        />
      </div>
      
      {/* Mobile pagination controls */}
      <div className="md:hidden flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousPage}
          disabled={currentPage === 0 || !hasGeneratedContent}
          className={!hasGeneratedContent ? 'opacity-50' : ''}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {currentPage + 1} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextPage}
          disabled={currentPage === totalPages - 1 || !hasGeneratedContent}
          className={!hasGeneratedContent ? 'opacity-50' : ''}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {personas.map((persona) => (
          <div
            key={persona.id}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
              formData.personaId === persona.id
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/50'
                : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
            } ${!hasGeneratedContent ? 'opacity-50 pointer-events-none' : ''} ${
              showAgentBubble && !formData.personaId ? 'ring-2 ring-primary-500 ring-opacity-50 animate-pulse' : ''
            }`}
            onClick={() => {
              setFormData(prev => ({ ...prev, personaId: persona.id, coverImageUrl: persona.avatar_url }));
              setShowAgentBubble(false);
            }}
          >
            <div className="flex items-center space-x-3 md:space-x-4">
              <Avatar
                src={persona.avatar_url}
                name={persona.name}
                size="sm"
                className="md:w-10 md:h-10"
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  {persona.name}
                </p>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">
                  {persona.role}
                  {persona.company && ` at ${persona.company}`}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};