import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';

interface Store {
  id: string;
  name: string;
}

interface DeleteStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: Store | null;
  onSuccess: () => void;
}

export const DeleteStoreModal: React.FC<DeleteStoreModalProps> = ({
  isOpen,
  onClose,
  store,
  onSuccess,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!store) return;

    setIsDeleting(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', store.id);

      if (error) throw error;
      onSuccess();
    } catch (err: any) {
      console.error('Error deleting store:', err);
      setError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Store"
    >
      <div className="space-y-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-warning-500 mr-2" />
          <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to delete {store?.name}? This action cannot be undone.
          </p>
        </div>

        {error && (
          <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
        )}

        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="error"
            onClick={handleDelete}
            isLoading={isDeleting}
          >
            Delete Store
          </Button>
        </div>
      </div>
    </Modal>
  );
};