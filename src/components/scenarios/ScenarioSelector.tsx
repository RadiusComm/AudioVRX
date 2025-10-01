import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface ScenarioSelectorProps {
  onRoleSelect: (role: string) => void;
  onScenarioSelect: (scenario: string) => void;
}

const roles = [
  { id: 'sales', label: 'Sales Person' },
  { id: 'customer_service', label: 'Customer Service Representative' },
  { id: 'manager', label: 'Manager' },
  { id: 'tech_support', label: 'Technical Support Agent' },
  { id: 'customer', label: 'Customer' },
  { id: 'account_manager', label: 'Account Manager' },
  { id: 'bdr', label: 'Business Development Representative' },
  { id: 'field_service', label: 'Field Service Technician' }
];

const scenariosByRole: Record<string, Array<{ id: string; label: string }>> = {
  sales: [
    { id: 'closing_deals', label: 'Closing sales deals' },
    { id: 'negotiating', label: 'Negotiating pricing' },
    { id: 'upselling', label: 'Upselling and cross-selling' },
    { id: 'building_relationships', label: 'Building customer relationships' }
  ],
  customer_service: [
    { id: 'difficult_customers', label: 'Dealing with difficult customers' },
    { id: 'complaints', label: 'Handling customer complaints' },
    { id: 'refunds', label: 'Processing refunds' },
    { id: 'billing', label: 'Addressing billing disputes' }
  ],
  manager: [
    { id: 'escalations', label: 'Managing escalations' },
    { id: 'team_performance', label: 'Team performance reviews' },
    { id: 'customer_retention', label: 'Customer retention strategies' }
  ],
  tech_support: [
    { id: 'technical_issues', label: 'Resolving technical issues' },
    { id: 'product_features', label: 'Explaining product features' },
    { id: 'troubleshooting', label: 'Advanced troubleshooting' }
  ],
  customer: [
    { id: 'service_issues', label: 'Reporting service issues' },
    { id: 'product_inquiries', label: 'Product inquiries' },
    { id: 'account_help', label: 'Account assistance' }
  ],
  account_manager: [
    { id: 'account_reviews', label: 'Quarterly account reviews' },
    { id: 'contract_renewal', label: 'Contract renewal discussions' },
    { id: 'strategic_planning', label: 'Strategic planning sessions' }
  ],
  bdr: [
    { id: 'prospecting', label: 'Prospecting calls' },
    { id: 'lead_qualification', label: 'Lead qualification' },
    { id: 'meeting_scheduling', label: 'Meeting scheduling' }
  ],
  field_service: [
    { id: 'service_delays', label: 'Managing service delays' },
    { id: 'on_site_support', label: 'On-site support' },
    { id: 'installation', label: 'Installation procedures' }
  ]
};

export const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({
  onRoleSelect,
  onScenarioSelect
}) => {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [isScenarioOpen, setIsScenarioOpen] = useState(false);

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    setSelectedScenario('');
    onRoleSelect(roleId);
    setIsRoleOpen(false);
  };

  const handleScenarioSelect = (scenarioId: string) => {
    setSelectedScenario(scenarioId);
    onScenarioSelect(scenarioId);
    setIsScenarioOpen(false);
  };

  const getSelectedRoleLabel = () => {
    const role = roles.find(r => r.id === selectedRole);
    return role ? role.label : 'Select your role';
  };

  const getSelectedScenarioLabel = () => {
    if (!selectedRole || !selectedScenario) return 'Choose scenario';
    const scenario = scenariosByRole[selectedRole]?.find(s => s.id === selectedScenario);
    return scenario ? scenario.label : 'Choose scenario';
  };

  return (
    <div className="space-y-4 mb-8">
      <div className="relative">
        <button
          onClick={() => setIsRoleOpen(!isRoleOpen)}
          className={`w-full px-4 py-2.5 text-left bg-white dark:bg-gray-800 rounded-lg border ${
            isRoleOpen ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-gray-300 dark:border-gray-600'
          } shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200`}
          aria-haspopup="listbox"
          aria-expanded={isRoleOpen}
        >
          <div className="flex items-center justify-between">
            <span className={`block truncate ${
              selectedRole ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {getSelectedRoleLabel()}
            </span>
            <ChevronDown
              className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                isRoleOpen ? 'transform rotate-180' : ''
              }`}
            />
          </div>
        </button>

        <AnimatePresence>
          {isRoleOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 shadow-lg max-h-60 overflow-auto"
            >
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => handleRoleSelect(role.id)}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    selectedRole === role.id ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative">
        <button
          onClick={() => selectedRole && setIsScenarioOpen(!isScenarioOpen)}
          disabled={!selectedRole}
          className={`w-full px-4 py-2.5 text-left bg-white dark:bg-gray-800 rounded-lg border ${
            !selectedRole
              ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-not-allowed'
              : isScenarioOpen
              ? 'border-primary-500 ring-2 ring-primary-500/20'
              : 'border-gray-300 dark:border-gray-600'
          } shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200`}
          aria-haspopup="listbox"
          aria-expanded={isScenarioOpen}
        >
          <div className="flex items-center justify-between">
            <span className={`block truncate ${
              selectedScenario ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {getSelectedScenarioLabel()}
            </span>
            <ChevronDown
              className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                isScenarioOpen ? 'transform rotate-180' : ''
              }`}
            />
          </div>
        </button>

        <AnimatePresence>
          {isScenarioOpen && selectedRole && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 shadow-lg max-h-60 overflow-auto"
            >
              {scenariosByRole[selectedRole]?.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => handleScenarioSelect(scenario.id)}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    selectedScenario === scenario.id ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {scenario.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};