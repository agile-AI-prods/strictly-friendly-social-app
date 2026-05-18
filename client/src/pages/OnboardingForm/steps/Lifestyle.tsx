import { useFormData } from '../../../context/FormDataContext';
import { FormData } from '../../../context/FormDataContext';

export const Lifestyle = () => {
  const { formData, updateFormData } = useFormData();

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    console.log('handleCheckboxChange', name, value, checked);
    
    if (checked) {
      updateFormData({
        lifestyle: {
          ...formData.lifestyle,
          [name]: [...(formData.lifestyle[name as keyof typeof formData.lifestyle] as string[] || []), value]
        }
      });
    } else {
      updateFormData({
        lifestyle: {
          ...formData.lifestyle,
          [name]: (formData.lifestyle[name as keyof typeof formData.lifestyle] as string[] || []).filter(item => item !== value)
        }
      });
    }
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateFormData({
      lifestyle: {
        ...formData.lifestyle,
        [name]: value
      }
    });
  };

  const hobbyOptions = ['Reading', 'Sports', 'Cooking', 'Travel', 'Music', 'Art', 'Gaming', 'Fitness', 'Photography', 'Dancing'];
  const activityOptions = ['Outdoor activities', 'Indoor activities', 'Cultural events', 'Sports events', 'Social gatherings', 'Volunteering'];
  const lifeStageOptions = ['College student', 'Working professional', 'Parent', 'Retired', 'New to area'];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Lifestyle and Activities</h3>
      <p className="text-gray-600">Share your interests and daily activities</p>
      
      <div>
        <label className="form-label flex items-center">
          Life Stage <span className="text-red-500 mr-2">*</span>
          <span className="tag tag-matching">Used in Matching</span>
        </label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {lifeStageOptions.map(option => (
            <div key={option} className="flex items-center">
              <input
                type="checkbox"
                id={option.toLowerCase().replace(/\s+/g, '-')}
                name="lifeStage"
                value={option}
                checked={(formData.lifestyle.lifeStage || []).includes(option)}
                onChange={(e) => {
                  const { checked } = e.target;
                  if (checked) {
                    updateFormData({
                      lifestyle: {
                        ...formData.lifestyle,
                        lifeStage: [...(formData.lifestyle.lifeStage || []), option]
                      }
                    });
                  } else {
                    updateFormData({
                      lifestyle: {
                        ...formData.lifestyle,
                        lifeStage: (formData.lifestyle.lifeStage || []).filter(item => item !== option)
                      }
                    });
                  }
                }}
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
          Hobbies <span className="text-red-500 mr-2">*</span>
          <span className="tag tag-matching">Used in Matching</span>
        </label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {hobbyOptions.map(option => (
            <div key={option} className="flex items-center">
              <input
                type="checkbox"
                id={option.toLowerCase()}
                name="hobbies"
                value={option}
                checked={(formData.lifestyle.hobbies || []).includes(option)}
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
        <label className="form-label flex items-center">
          Activities <span className="text-red-500 mr-2">*</span>
          <span className="tag tag-matching">Used in Matching</span>
        </label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {activityOptions.map(option => (
            <div key={option} className="flex items-center">
              <input
                type="checkbox"
                id={option.replace(/\s+/g, '-').toLowerCase()}
                name="activities"
                value={option}
                checked={(formData.lifestyle.activities || []).includes(option)}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
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
          Schedule <span className="text-red-500 mr-2">*</span>
          <span className="tag tag-matching">Used in Matching</span>
        </label>
        <select
          id="schedule"
          name="schedule"
          value={formData.lifestyle.schedule}
          onChange={(e) => handleRadioChange(e as any)}
          className="form-input"
          required
        >
          <option value="">Select your typical schedule</option>
          <option value="Morning person">Morning person</option>
          <option value="Night owl">Night owl</option>
          <option value="Flexible">Flexible</option>
          <option value="Regular 9-5">Regular 9-5</option>
          <option value="Shift work">Shift work</option>
        </select>
      </div>
    </div>
  );
};

 