import React, { useState } from 'react';
import { Calendar, AlertCircle, Mail, Plus, Store, Shield } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  role: string;
}

interface Scenario {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  cover_image_url?: string;
  tags?: string[];
}

interface AddSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employees: Employee[];
  scenarios: Scenario[];
  getRoleColor: (role: string) => string;
  getDifficultyColor: (difficulty: string) => string;
}

export const AddSessionModal: React.FC<AddSessionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  employees,
  scenarios,
  getRoleColor,
  getDifficultyColor
}) => {
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const resetForm = () => {
    setSelectedScenario(null);
    setSelectedEmployee(null);
    setScheduledDate('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSchedule = async () => {
    if (!selectedScenario || !selectedEmployee || !scheduledDate) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      // Create a date at 9:00 AM on the selected date
      const scheduledDateTime = new Date(scheduledDate);
      scheduledDateTime.setHours(9, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('roleplay_sessions')
        .insert([{
          user_id: selectedEmployee.id,
          scenario_id: selectedScenario.id,
          start_time: scheduledDateTime.toISOString(),
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;

      // Send email notification
      await sendEmailNotification(data.id);

      handleClose();
      onSuccess();
      
      toast.success('Session scheduled successfully and notification email sent');
    } catch (err: any) {
      console.error('Error scheduling session:', err);
      setError('Error scheduling session: ' + err.message);
      toast.error('Failed to schedule session');
    }
  };

  const sendEmailNotification = async (sessionId: string) => {
    try {
      setIsSendingEmail(true);
      
      const baseUrl = window.location.origin;
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-schedule-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          baseUrl
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email notification');
      }

      return await response.json();
    } catch (err) {
      console.error('Error sending email notification:', err);
      throw err;
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Schedule Session"
    >
      <div className="space-y-6 p-6">
        {error && (
          <div className="p-4 bg-error-50 dark:bg-error-900/50 rounded-lg border border-error-200 dark:border-error-800 flex items-center">
            <AlertCircle className="h-5 w-5 text-error-500 mr-2" />
            <p className="text-sm text-error-700 dark:text-error-300">{error}</p>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Employee *
          </label>
          <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto p-1 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            {employees.map((employee) => (
              <div
                key={employee.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedEmployee?.id === employee.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/50 shadow-lg ring-2 ring-primary-200 dark:ring-primary-800'
                    : 'border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600 bg-white dark:bg-gray-700'
                }`}
                onClick={() => setSelectedEmployee(employee)}
              >
                <div className="flex items-center space-x-4">
                  <Avatar
                    src={employee.avatar_url}
                    name={`${employee.first_name} ${employee.last_name}`}
                    size="md"
                    className="ring-2 ring-white dark:ring-gray-800 shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {employee.first_name} {employee.last_name}
                    </p>
                    <div className="flex items-center mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(employee.role)}`}>
                      <Shield className="h-3 w-3 mr-1" />
                      {employee.role}
                      </span>
                    </div>
                  </div>
                  {selectedEmployee?.id === employee.id && (
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Role-Play Scenario *
          </label>
          <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto p-1 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            {scenarios.map((scenario) => (
              <div
                key={scenario.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedScenario?.id === scenario.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/50 shadow-lg ring-2 ring-primary-200 dark:ring-primary-800'
                    : 'border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600 bg-white dark:bg-gray-700'
                }`}
                onClick={() => setSelectedScenario(scenario)}
              >
                <div className="flex items-start space-x-4">
                  {scenario.cover_image_url && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 shadow-sm ring-2 ring-white dark:ring-gray-800">
                      <img 
                        src={scenario.cover_image_url} 
                        alt={scenario.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-base text-gray-900 dark:text-white mb-2">
                      {scenario.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                      {scenario.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(scenario.difficulty)}`}>
                        {scenario.difficulty}
                      </span>
                      
                      {scenario.tags && scenario.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {scenario.tags.slice(0, 2).map((tag, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300">
                              {tag}
                            </span>
                          ))}
                          {scenario.tags.length > 2 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              +{scenario.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {selectedScenario?.id === scenario.id && (
                    <div className="flex-shrink-0 self-start mt-2">
                      <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Date
          </label>
          <Input
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            leftIcon={<Calendar className="h-5 w-5" />}
            fullWidth
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSchedule}
            leftIcon={<Plus className="h-4 w-4" />}
            className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600"
            isLoading={isSendingEmail}
            className="w-full sm:w-auto bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600"
          >
            Schedule & Send Invite
          </Button>
        </div>
      </div>
    </Modal>
  );
};