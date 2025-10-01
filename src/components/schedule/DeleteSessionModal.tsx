import React, { useState } from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
  };
}

interface DeleteSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedSession: Session | null;
}

export const DeleteSessionModal: React.FC<DeleteSessionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  selectedSession
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!selectedSession) return;

    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('roleplay_sessions')
        .delete()
        .eq('id', selectedSession.id);

      if (error) throw error;

      onClose();
      onSuccess();
      toast.success('Session deleted successfully');
    } catch (err: any) {
      console.error('Error deleting session:', err);
      toast.error('Failed to delete session');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Scheduled Session"
    >
      <div className="space-y-6 p-6">
        {selectedSession && (
          <div className="bg-error-50 dark:bg-error-900/30 p-4 rounded-lg border border-error-100 dark:border-error-800/50 mb-4">
            <div className="flex items-center space-x-3">
              <Avatar
                src={selectedSession.user.avatar_url}
                name={`${selectedSession.user.first_name} ${selectedSession.user.last_name}`}
                size="sm"
              />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {selectedSession.user.first_name} {selectedSession.user.last_name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedSession.scenario.title} - {format(new Date(selectedSession.start_time), 'MMMM d, yyyy')}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <p className="text-gray-600 dark:text-gray-300">
          Are you sure you want to delete this scheduled session? This action cannot be undone.
        </p>

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="error"
            onClick={handleDelete}
            leftIcon={<Trash2 className="h-4 w-4" />}
            isLoading={isDeleting}
          >
            Delete Session
          </Button>
        </div>
      </div>
    </Modal>
  );
};