import { useFormData } from '../../../context/FormDataContext';

export const LightningRound = () => {
  const { formData, updateFormData } = useFormData();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateFormData({
      lightningRound: {
        ...formData.lightningRound,
        [name]: value
      }
    });
    console.log(formData)
  };

  const characters = [
    'Hermione Granger',
    'Tony Stark',
    'Wonder Woman',
    'Sherlock Holmes',
    'Katniss Everdeen'
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Lightning Round</h3>
      <p className="text-gray-600">Quick questions to help us understand you better</p>
      
      <div>
        <label className="form-label flex items-center">
          If you could be any fictional character, who would you be? <span className="text-red-500 mr-2">*</span>
          <span className="tag tag-matching">Used in Matching</span>
        </label>
        <div className="space-y-2 mt-2">
          {characters.map(character => (
            <div key={character} className="flex items-center">
              <input
                type="radio"
                id={character.replace(/\s+/g, '-').toLowerCase()}
                name="fictionalCharacter"
                value={character}
                checked={formData.lightningRound.fictionalCharacter === character}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <label 
                htmlFor={character.replace(/\s+/g, '-').toLowerCase()} 
                className="ml-3 block text-sm font-medium text-gray-700"
              >
                {character}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LightningRound;
 