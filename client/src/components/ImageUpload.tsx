import { ChangeEvent, useRef } from 'react';
import { Camera } from 'lucide-react';
import { message } from 'antd';

interface ImageUploadProps {
  currentImage?: string;
  onUpload: (file: File) => void;
  isLoading?: boolean;
}

export const ImageUpload = ({
  currentImage,
  onUpload,
  isLoading = false
}: ImageUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Debug logging
  console.log('🖼️ ImageUpload component rendered with currentImage:', currentImage);
  console.log('🖼️ ImageUpload currentImage type:', typeof currentImage);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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

      onUpload(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex items-center space-x-4">
      <div
        className={`relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 ${
          isLoading ? 'opacity-50' : ''
        }`}
      >
        {currentImage ? (
          <img
            src={currentImage}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Camera className="w-8 w-8" />
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        {isLoading ? 'Uploading...' : 'Change Photo'}
      </button>
    </div>
  );
}; 