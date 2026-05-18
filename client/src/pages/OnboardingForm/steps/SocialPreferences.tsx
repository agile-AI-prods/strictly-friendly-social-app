import { useFormData } from '../../../context/FormDataContext';
import { FormData } from '../../../context/FormDataContext';

export const SocialPreferences = () => {
  const { formData, updateFormData } = useFormData();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log('handleChange', name, value)
    updateFormData({
      socialPreferences: {
        ...formData.socialPreferences,
        [name]: value
      }
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    console.log('handlecheckboxchange', name, value, checked);

    if (checked) {
      updateFormData({
        socialPreferences: {
          ...formData.socialPreferences,
          [name]: [...(formData.socialPreferences[name as keyof typeof formData.socialPreferences] as string[] || []), value]
        }
      });
    } else {
      updateFormData({
        socialPreferences: {
          ...formData.socialPreferences,
          [name]: (formData.socialPreferences[name as keyof typeof formData.socialPreferences] as string[] || []).filter(item => item !== value)
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Social Preferences</h3>
      <p className="text-gray-600">Tell us how you like to socialize</p>

      <div>
        <label className="form-label flex items-center">
          What are you looking for? <span className="text-red-500 mr-2">*</span>
          <span className="tag tag-matching">Used in Matching</span>
        </label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {[
            'Activity Partners',
            'Friendship',
            'Professional Network',
            'Study Groups',
            'Travel Buddies',
            'Support Group'
          ].map(option => (
            <div key={option} className="flex items-center">
              <input
                type="checkbox"
                id={option.toLowerCase().replace(/\s+/g, '-')}
                name='looking_for'
                value={option}
                checked={(formData.socialPreferences.looking_for || []).includes(option)}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label
                htmlFor={option.toLowerCase().replace(/\s+/g, '-')}
                className="ml-2 block text-sm text-gray-700"
              >
                {option}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="form-label flex items-center">
          Relationship Type <span className="text-red-500 mr-2">*</span>
          <span className="tag tag-matching">Used in Matching</span>
        </label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {[
            'Casual Friends',
            'Close Friends',
            'Professional',
            'Mentorship',
            'Activity Partners',
            'Support Network'
          ].map(option => (
            <div key={option} className="flex items-center">
              <input
                type="checkbox"
                id={option.toLowerCase().replace(/\s+/g, '-')}
                name='relationship_type'
                value={option}
                checked={(formData.socialPreferences.relationship_type || []).includes(option)}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label
                htmlFor={option.toLowerCase().replace(/\s+/g, '-')}
                className="ml-2 block text-sm text-gray-700"
              >
                {option}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="form-label flex items-center">
          Preferred social setting <span className="text-red-500 mr-2">*</span>
          <span className="tag tag-matching">Used in Matching</span>
        </label>
        <div className="space-y-2 mt-2">
          {['One-on-one meetups', 'Small groups', 'Large group events', 'Online chats only'].map(option => (
            <div key={option} className="flex items-center">
              <input
                type="radio"
                id={option.replace(/\s+/g, '-').toLowerCase()}
                name="socialSetting"
                value={option}
                checked={formData.socialPreferences.socialSetting === option}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <label
                htmlFor={option.replace(/\s+/g, '-').toLowerCase()}
                className="ml-2 block text-sm text-gray-700"
              >
                {option}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="form-label flex items-center">
          Preferred time for socializing <span className="text-red-500 mr-2">*</span>
          <span className="tag tag-matching">Used in Matching</span>
        </label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {['Mornings', 'Afternoons', 'Evenings', 'Weekends'].map(option => (
            <div key={option} className="flex items-center">
              <input
                type="checkbox"
                id={option.toLowerCase()}
                name="times"
                value={option}
                checked={(formData.socialPreferences.times || []).includes(option)}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label
                htmlFor={option.toLowerCase()}
                className="ml-2 block text-sm text-gray-700"
              >
                {option}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="availability" className="form-label flex items-center">
          Frequency of availability <span className="text-red-500 mr-2">*</span>
          <span className="tag tag-matching">Used in Matching</span>
        </label>
        <select
          id="availability"
          name="availability"
          value={formData.socialPreferences.availability}
          onChange={handleChange}
          className="form-input"
          required
        >
          <option value="">Select how often you're available</option>
          <option value="Daily">Daily</option>
          <option value="Weekly">Weekly</option>
          <option value="Monthly">Monthly</option>
        </select>
      </div>

      <div>
        <label htmlFor="communicationStyle" className="form-label flex items-center">
          Communication Style <span className="text-red-500 mr-2">*</span>
          <span className="tag tag-matching">Used in Matching</span>
        </label>
        <select
          id="communicationStyle"
          name="communicationStyle"
          value={formData.socialPreferences.communicationStyle}
          onChange={handleChange}
          className="form-input"
          required
        >
          <option value="">Select your preferred communication style</option>
          <option value="Texting">Texting</option>
          <option value="Phone Calls">Phone Calls</option>
          <option value="Voice Notes">Voice Notes</option>
          <option value="In-person only">In-person only</option>
          <option value="Social Media">Social Media</option>
          <option value="Email">Email</option>
        </select>
      </div>
    </div>
  );
};

