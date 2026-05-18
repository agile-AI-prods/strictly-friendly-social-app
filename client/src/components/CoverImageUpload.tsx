import React, { useRef, ChangeEvent, useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { uploadCoverImage } from '../api/profileApi';
import { useAppSelector } from '../store/hooks';
import { message } from 'antd';

interface CoverImageUploadProps {
  currentImage?: string;
  onUpload: (coverUrl: string) => void;
  isLoading?: boolean;
  userId: string;
}

export const CoverImageUpload = ({
  currentImage,
  onUpload,
  isLoading = false,
  userId
}: CoverImageUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const currentUser = useAppSelector(state => state.auth.user);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUser) {
      // Check file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        message.error('File size must be less than 5MB. Please choose a smaller image.');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        message.error('Please select a valid image file.');
        return;
      }

      try {
        setUploading(true);
        const result = await uploadCoverImage(userId, file);
        
        // Backend returns { coverUrl: "url_string" }
        const coverUrl = result.coverUrl || '';
        
        console.log('🔍 Cover upload result:', result);
        console.log('🔍 Cover URL:', coverUrl);
        
        onUpload(coverUrl);
        message.success('Cover image uploaded successfully!');
      } catch (error: any) {
        console.error('Error uploading cover image:', error);
        
        // Handle specific error types
        if (error?.response?.status === 413) {
          message.error('File size is too large. Please choose an image smaller than 5MB.');
        } else if (error?.response?.data?.error) {
          message.error(error.response.data.error);
        } else if (error?.message) {
          message.error(error.message);
        } else {
          message.error('Failed to upload cover image. Please try again.');
        }
      } finally {
        setUploading(false);
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    onUpload('');
    message.success('Cover image removed!');
  };

  return (
    <div className="relative">
      <div
        className={`relative w-full h-48 rounded-lg overflow-hidden bg-gray-100 ${
          isLoading || uploading ? 'opacity-50' : ''
        }`}
      >
        {currentImage ? (
          <img
            src={currentImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Camera className="w-12 h-12" />
          </div>
        )}
        
        {/* Upload overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
          <button
            type="button"
            onClick={handleClick}
            disabled={isLoading || uploading}
            className="opacity-0 hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-90 text-gray-700 px-4 py-2 rounded-md flex items-center space-x-2"
          >
            <Upload className="w-4 w-4" />
            <span>{uploading ? 'Uploading...' : 'Upload Cover'}</span>
          </button>
        </div>

        {/* Remove button */}
        {currentImage && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={isLoading || uploading}
            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}; 