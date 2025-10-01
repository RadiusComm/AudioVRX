import React from 'react';
import { Tag, Upload, Camera } from 'lucide-react';
import { Input } from '../ui/Input';
import { EditableFieldNotice } from './ScenarioContent';

interface ScenarioMetadataProps {
  formData: {
    tags: string;
    coverImageUrl: string;
    isPublic: boolean;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  hasGeneratedContent: boolean;
  onImageUpload?: (file: File) => Promise<void>;
  isUploading?: boolean;
}

export const ScenarioMetadata: React.FC<ScenarioMetadataProps> = ({
  formData,
  handleChange,
  hasGeneratedContent,
  onImageUpload,
  isUploading = false
}) => {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) {
      await onImageUpload(file);
    }
  };

  return (
    <>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Tags
        </label>
        <Input
          name="tags"
          value={formData.tags}
          onChange={handleChange}
          placeholder="Enter comma-separated tags"
          leftIcon={<Tag className="h-5 w-5" />}
          fullWidth
          disabled={!hasGeneratedContent}
          className={!hasGeneratedContent ? 'opacity-50' : ''}
        />
        <EditableFieldNotice show={hasGeneratedContent} />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Cover Image URL
        </label>
        
        {/* File Upload Option */}
        <div className={`mb-4 ${!hasGeneratedContent ? 'opacity-50 pointer-events-none' : ''}`}>
          <label className="flex flex-col items-center px-4 py-6 bg-white dark:bg-gray-800 text-gray-400 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
            <Upload className="h-8 w-8 mb-2" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {isUploading ? 'Uploading...' : 'Upload cover image'}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              PNG, JPG up to 5MB
            </span>
            <input 
              type="file" 
              className="hidden" 
              accept="image/png, image/jpeg, image/jpg" 
              onChange={handleFileChange}
              disabled={!hasGeneratedContent || isUploading}
            />
          </label>
        </div>
        
        <div className="relative text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-2 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800">OR</span>
          </div>
        </div>
        
        <Input
          name="coverImageUrl"
          value={formData.coverImageUrl}
          onChange={handleChange}
          placeholder="Enter image URL"
          leftIcon={<Camera className="h-5 w-5" />}
          helpText="Recommended size: 1280x720px"
          fullWidth
          disabled={!hasGeneratedContent}
          className={!hasGeneratedContent ? 'opacity-50' : ''}
        />
        <EditableFieldNotice show={hasGeneratedContent} />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isPublic"
          name="isPublic"
          checked={formData.isPublic}
          onChange={handleChange}
          className={`h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded ${!hasGeneratedContent ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!hasGeneratedContent}
        />
        <label htmlFor="isPublic" className={`ml-2 block text-sm text-gray-700 dark:text-gray-300 ${!hasGeneratedContent ? 'opacity-50' : ''}`}>
          Make this role-play public
        </label>
      </div>
    </>
  );
};