import React, { useState, useEffect } from 'react';
import { Building, MapPin, Upload, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface Store {
  id: string;
  name: string;
  location: string;
  store_id: string;
  description: string;
  image_url: string;
  status: 'pending' | 'active' | 'inactive';
  owner_id: string;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface StoreFormProps {
  isOpen: boolean;
  onClose: () => void;
  store: Store | null;
  onSuccess: () => void;
}

export const StoreForm: React.FC<StoreFormProps> = ({
  isOpen,
  onClose,
  store,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    store_id: '',
    description: '',
    image_url: '',
    status: 'pending',
    owner_id: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name || '',
        location: store.location || '',
        store_id: store.store_id || '',
        description: store.description || '',
        image_url: store.image_url || '',
        status: store.status || 'pending',
        owner_id: store.owner_id || '',
      });
      if (store.image_url) {
        setImagePreview(store.image_url);
      }
    } else {
      setFormData({
        name: '',
        location: '',
        store_id: '',
        description: '',
        image_url: '',
        status: 'pending',
        owner_id: '',
      });
      setImageFile(null);
      setImagePreview('');
    }
    
    loadUsers();
  }, [store, isOpen]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .order('first_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Only JPG and PNG files are allowed');
      return;
    }

    // Check file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let imageUrl = formData.image_url;

      // If there's a new image file, upload it
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `store-logos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('store-logos')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('store-logos')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      if (store) {
        const { error } = await supabase
          .from('stores')
          .update({
            name: formData.name,
            location: formData.location,
            store_id: formData.store_id,
            description: formData.description,
            image_url: imageUrl,
            status: formData.status,
            owner_id: formData.owner_id || null,
          })
          .eq('id', store.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('stores')
          .insert([{
            name: formData.name,
            location: formData.location,
            store_id: formData.store_id,
            description: formData.description,
            image_url: imageUrl,
            status: formData.status,
            owner_id: formData.owner_id || null,
          }]);

        if (error) throw error;
      }

      onSuccess();
    } catch (err: any) {
      console.error('Error saving store:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={store ? "Edit Store" : "Add Store"}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
          <div className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-error-50 dark:bg-error-900/50 rounded-lg border border-error-200 dark:border-error-800 flex items-start">
                <AlertCircle className="h-5 w-5 text-error-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
              </div>
            )}

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Store Logo
              </label>
              <div className="flex items-center space-x-4">
                {imagePreview && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <img 
                      src={imagePreview} 
                      alt="Store logo preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <label className="flex flex-col items-center px-4 py-6 bg-white dark:bg-gray-800 text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <Upload className="h-6 w-6 mb-2" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Upload logo image</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">PNG, JPG up to 5MB</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/png, image/jpeg" 
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
              </div>
              {!imageFile && formData.image_url && (
                <Input
                  label="Or enter image URL"
                  name="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  fullWidth
                />
              )}
            </div>

            <Input
              label="Store Name"
              name="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              leftIcon={<Building className="h-5 w-5" />}
              placeholder="Enter store name"
              fullWidth
            />

            <Input
              label="Location"
              name="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              leftIcon={<MapPin className="h-5 w-5" />}
              placeholder="Enter store location"
              fullWidth
            />

            <Input
              label="Store ID"
              name="store_id"
              value={formData.store_id}
              onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
              placeholder="Enter external reference ID"
              helpText="Optional: Use for external system reference"
              fullWidth
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'pending' | 'active' | 'inactive' })}
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                required
              >
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Store Owner
              </label>
              <select
                name="owner_id"
                value={formData.owner_id}
                onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="">Select an owner</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.first_name} {user.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Enter store description"
              />
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitting}
                className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600"
              >
                {store ? 'Save Changes' : 'Add Store'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};