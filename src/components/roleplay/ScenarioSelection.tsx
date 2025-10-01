import React from 'react';
import { Phone, Shield, MessageSquare } from 'lucide-react';
import { Button } from '../ui/Button';
import { Persona } from '../../types';

interface ScenarioSelectionProps {
  onSelect: (type: string, persona: Persona) => void;
  personas: Persona[];
  selectedType: string | null;
}

export const ScenarioSelection: React.FC<ScenarioSelectionProps> = ({ 
  onSelect, 
  personas,
  selectedType 
}) => {
  // Map personas to specific scenario types
  const scenarios = [
    {
      id: 'new-customer',
      title: 'New Customer',
      icon: Phone,
      color: 'text-primary-600 dark:text-primary-400',
      persona: personas.find(p => p.role.toLowerCase().includes('sales')),
    },
    {
      id: 'returninig-customer',
      title: 'Returning Customer',
      icon: MessageSquare,
      color: 'text-secondary-600 dark:text-secondary-400',
      persona: personas.find(p => p.role.toLowerCase().includes('business development')),
    },
    {
      id: 'sales-associate',
      title: 'Sales Associate',
      icon: Shield,
      color: 'text-accent-600 dark:text-accent-400',
      persona: personas.find(p => p.role.toLowerCase().includes('account')),
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <div className="grid gap-4">
          {scenarios.map((scenario) => (
            <div key={scenario.id} className="space-y-2">
              {scenario.persona ? (
                <Button
                  variant={selectedType === scenario.id ? 'primary' : 'outline'}
                  className={`justify-start h-auto px-4 py-3 w-full ${
                    selectedType === scenario.id 
                      ? 'bg-primary-500 text-white hover:bg-primary-600'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => onSelect(scenario.id, scenario.persona!)}
                >
                  <scenario.icon className={`h-5 w-5 mr-3 ${selectedType === scenario.id ? 'text-white' : scenario.color} flex-shrink-0`} />
                  <div className="text-left">
                    <span className={`font-medium block ${selectedType === scenario.id ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                      {scenario.title}
                    </span>
                    <span className={`text-sm block mt-1 ${selectedType === scenario.id ? 'text-white/90' : 'text-gray-500 dark:text-gray-400'}`}>
                      with {scenario.persona.name} - {scenario.persona.role}
                      {scenario.persona.company && `, ${scenario.persona.company}`}
                    </span>
                  </div>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="justify-start h-auto px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 w-full opacity-50 cursor-not-allowed"
                  disabled
                >
                  <scenario.icon className={`h-5 w-5 mr-3 ${scenario.color} flex-shrink-0`} />
                  <div className="text-left">
                    <span className="text-gray-700 dark:text-gray-300 font-medium block">
                      {scenario.title}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 block mt-1">
                      No IQ Agent available
                    </span>
                  </div>
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};