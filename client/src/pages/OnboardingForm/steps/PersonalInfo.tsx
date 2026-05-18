import { useState } from 'react';
import { useAppSelector } from '../../../store/hooks';
import { useFormData } from '../../../context/FormDataContext';
import { ImageUpload } from '../../../components/ImageUpload';
import { CoverImageUpload } from '../../../components/CoverImageUpload';
import { Textarea } from '../../../components/Textarea';
import { uploadPhoto, uploadCoverImage } from '../../../api/profileApi';
import { message } from 'antd';

export const PersonalInfo = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { formData, updateFormData } = useFormData();
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
  };

  const handlePhotoUpload = async (file: File) => {
    if (!user) return;

    try {
      setIsUploading(true);
      const response = await uploadPhoto(user.id, file);
      // Server returns { photoUrl: "url_string" }
      updateFormData({ photoUrl: response.photoUrl });
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      message.error('Failed to upload profile photo. Please try again.');
      console.error('Error uploading photo:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCoverUpload = async (coverUrl: string) => {
    updateFormData({ coverUrl });
  };

  const reasonOptions = [
    "Looking for activity partners",
    "Just moved to a new city",
    "Want to expand my social circle",
    "Other"
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Tell us a bit about yourself</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Profile Photo
        </label>
        <div className="mt-2">
          <CoverImageUpload
            currentImage={formData.coverUrl}
            onUpload={handleCoverUpload}
            isLoading={isUploading}
            userId={user?.id || ''}
          />
          <ImageUpload
            currentImage={formData.photoUrl}
            onUpload={handlePhotoUpload}
            isLoading={isUploading}
          />
        </div>
        <label htmlFor="name" className="form-label">First Name or Preferred Name <span className="text-red-500">*</span></label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="form-input"
          placeholder={"How you'd like to be called"}
          required
        />
      </div>

      <div>
        <label htmlFor="pronouns" className="form-label flex items-center">
          Pronouns
          <span className="ml-2 tag bg-gray-100 text-gray-700">Optional</span>
        </label>
        <select
          id="pronouns"
          name="pronouns"
          value={formData.pronouns}
          onChange={handleChange}
          className="form-input"
        >
          <option value="">Select your pronouns</option>
          <option value="He/Him">He/Him</option>
          <option value="She/Her">She/Her</option>
          <option value="They/Them">They/Them</option>
          <option value="Prefer not to say">Prefer not to say</option>
          <option value="Custom">Custom</option>
        </select>
        <p className="mt-1 text-sm text-gray-500">We ask pronouns so people can feel seen and respected — always optional.</p>
      </div>

      {formData.pronouns === 'Custom' && (
        <div>
          <label htmlFor="customPronouns" className="form-label">Custom Pronouns</label>
          <input
            type="text"
            id="customPronouns"
            name="customPronouns"
            onChange={handleChange}
            className="form-input"
            placeholder="Enter your pronouns"
          />
        </div>
      )}
      <div className="mt-1">
        <Textarea
          id="bio"
          value={formData.bio}
          placeholder='Tell me about yourself'
          className='form-input'
          onChange={(e) => updateFormData({ bio: e.target.value })}
          rows={3}
          required />
      </div>
      <div>
        <label htmlFor="age" className="form-label">Age <span className="text-red-500">*</span></label>
        <input
          type="number"
          id="age"
          name="age"
          value={formData.age}
          onChange={handleChange}
          className="form-input"
          placeholder="Your age"
          min="18"
          max="100"
          required
        />
      </div>

      <div>
        <label htmlFor="birthday" className="form-label">Birthday</label>
        <input
          type="date"
          id="birthday"
          name="birthday"
          value={formData.birthday}
          onChange={handleChange}
          className="form-input"
        />
      </div>

      <div>
        <label htmlFor="reasonForJoining" className="form-label">Why are you joining Strictly Friendly?</label>
        <select
          id="reasonForJoining"
          name="reasonForJoining"
          value={formData.reasonForJoining}
          onChange={handleChange}
          className="form-input"
        >
          <option value="">Select a reason</option>
          {reasonOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {formData.reasonForJoining === 'Other' && (
        <div>
          <label htmlFor="otherReason" className="form-label">Please specify your reason</label>
          <input
            type="text"
            id="otherReason"
            name="otherReason"
            value={formData.otherReason || ''}
            onChange={handleChange}
            className="form-input"
            placeholder="Tell us why you're joining Strictly Friendly"
            required
          />
        </div>
      )}
      <div>
        <label htmlFor="location" className="form-label">Location <span className="text-red-500">*</span></label>
        <input
          type="text"
          id="location"
          name="location"
          value={typeof formData.location === 'string' ? formData.location : formData.location.city || ''}
          onChange={(e) => {
            // Store location as a string for now, can be enhanced later
            updateFormData({ 
              location: {
                latitude: 0,
                longitude: 0,
                city: e.target.value
              }
            });
          }}
          className="form-input"
          placeholder="City, State"
          required
        />
      </div>
    </div>
  );
};

