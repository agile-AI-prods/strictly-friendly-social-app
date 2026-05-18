import { useFormData } from '../../../context/FormDataContext';

export const Boundaries = () => {
  const { formData, updateFormData } = useFormData();

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    console.log('handleCheckboxChange', name, value, checked);

    if (checked) {
      updateFormData({
        boundaries: {
          ...formData.boundaries,
          [name]: [...(formData.boundaries[name as keyof typeof formData.boundaries] as string[] || []), value]
        }
      });
    } else {
      updateFormData({
        boundaries: {
          ...formData.boundaries,
          [name]: (formData.boundaries[name as keyof typeof formData.boundaries] as string[] || []).filter(item => item !== value)
        }
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateFormData({
      boundaries: {
        ...formData.boundaries,
        [name]: value.split(',').map(s => s.trim()).filter(Boolean)
      }
    });
  };

  const dealbreakerOptions = [
    'Chronic flakiness',
    'Gossip',
    'Political discussions',
    'Religious discussions',
    'Substance use',
    'Late night activities',
    'Loud environments',
    'Large crowds'
  ];

  const preferenceOptions = [
    'Quiet environments',
    'Small gatherings',
    'Outdoor activities',
    'Indoor activities',
    'Early morning meetups',
    'Weekend activities',
    'Weekday activities',
    'Online interactions'
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Boundaries and Deal Breakers</h3>
      <p className="text-gray-600">Help us understand your comfort levels and boundaries</p>
      
      <div>
        <label className="form-label flex items-center">
          Deal Breakers <span className="text-red-500 mr-2">*</span>
          <span className="tag tag-personal">Just for You</span>
        </label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {dealbreakerOptions.map(option => (
            <div key={option} className="flex items-center">
              <input
                type="checkbox"
                id={option.toLowerCase().replace(/\s+/g, '-')}
                name="dealbreakers"
                value={option}
                checked={(formData.boundaries.dealbreakers || []).includes(option)}
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
          Preferences <span className="text-red-500 mr-2">*</span>
          <span className="tag tag-personal">Just for You</span>
        </label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {preferenceOptions.map(option => (
            <div key={option} className="flex items-center">
              <input
                type="checkbox"
                id={option.toLowerCase().replace(/\s+/g, '-')}
                name="preferences"
                value={option}
                checked={(formData.boundaries.preferences || []).includes(option)}
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
        <label htmlFor="additionalBoundaries" className="form-label flex items-center">
          Additional Boundaries or Preferences
          <span className="ml-2 tag tag-personal">Just for You</span>
        </label>
        <textarea
          id="additionalBoundaries"
          name="additionalBoundaries"
          value={formData.boundaries.preferences.join(', ')}
          onChange={handleChange}
          rows={4}
          className="form-input"
          placeholder="Add any other boundaries or preferences not listed above"
        />
      </div>
      
      <div className="bg-primary-50 p-4 rounded-lg mt-6">
        <h4 className="font-medium text-primary-900 mb-2">Why we ask</h4>
        <p className="text-sm text-primary-800">
          Understanding boundaries helps us ensure your comfort in new friendships. 
          These responses are private and used only to improve your experience.
        </p>
      </div>
    </div>
  );
};

 