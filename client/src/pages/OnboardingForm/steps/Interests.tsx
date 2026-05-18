import  { useState } from 'react';
import { useFormData } from '../../../context/FormDataContext';
import { Search, Plus, X } from 'lucide-react';

export const Interests = () => {
  const { formData, updateFormData } = useFormData();
  const [searchTerm, setSearchTerm] = useState('');

  const interestCategories = {
    'Arts & Culture': ['Museums', 'Theater', 'Photography', 'Painting', 'Music', 'Dance', 'Film', 'Concerts'],
    'Sports & Fitness': ['Gym', 'Running', 'Yoga', 'Hiking', 'Swimming', 'Tennis', 'Basketball', 'Soccer', 'Cycling'],
    'Outdoor Activities': ['Camping', 'Fishing', 'Picnics', 'Gardening', 'Birdwatching', 'Kayaking', 'Beach'],
    'Gaming': ['Video Games', 'Board Games', 'eSports', 'Card Games', 'Tabletop RPG', 'Puzzles'],
    'Food & Drink': ['Coffee shops', 'Cooking', 'Wine tasting', 'Breweries', 'Baking', 'Restaurants', 'Food Trucks'],
    'Reading & Writing': ['Book Clubs', 'Poetry', 'Journaling', 'Fiction', 'Non-fiction', 'Comics'],
    'Tech & Gadgets': ['Coding', 'Robotics', 'AR/VR', 'Startups', 'AI', 'Smart Home'],
    'Volunteering': ['Animal shelters', 'Community service', 'Environmental', 'Teaching', 'Mentoring'],
    'Travel': ['Local exploring', 'Road trips', 'International travel', 'Backpacking', 'Cruises', 'Cultural exchange'],
    'Learning': ['Language exchange', 'Online courses', 'Skill sharing', 'Workshops', 'DIY Projects']
  };

  // Flatten the interest categories for searching
  const allInterests = Object.values(interestCategories).flat();

  const filteredInterests = searchTerm
    ? allInterests.filter(interest => 
        interest.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const handleAddInterest = (interest: string) => {
    if (!formData.interests.includes(interest) && formData.interests.length < 10) {
      updateFormData({ interests: [...formData.interests, interest] });
      setSearchTerm('');
    }
  };

  const handleRemoveInterest = (interest: string) => {
    updateFormData({ 
      interests: formData.interests.filter(i => i !== interest) 
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Select Your Interests</h3>
      <p className="text-gray-600">Choose between 5 and 10 interests that define you</p>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="form-input pl-10"
          placeholder="Search interests or type your own"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {searchTerm && filteredInterests.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-md shadow-sm max-h-60 overflow-y-auto">
          {filteredInterests.map(interest => (
            <button
              key={interest}
              type="button"
              disabled={formData.interests.includes(interest) || formData.interests.length >= 10}
              onClick={() => handleAddInterest(interest)}
              className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center ${
                formData.interests.includes(interest) || formData.interests.length >= 10
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700'
              }`}
            >
              <Plus className="h-4 w-4 mr-2" />
              {interest}
            </button>
          ))}
        </div>
      )}
      
      {searchTerm && filteredInterests.length === 0 && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => handleAddInterest(searchTerm)}
            disabled={formData.interests.length >= 10}
            className={`text-primary-600 text-sm flex items-center ${
              formData.interests.length >= 10 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Plus className="h-4 w-4 mr-1" /> Add "{searchTerm}" as a custom interest
          </button>
        </div>
      )}
      
      <div className="mt-4">
        <label className="form-label">Selected Interests ({formData.interests.length}/10)</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.interests.length === 0 ? (
            <p className="text-gray-500 italic">No interests selected yet</p>
          ) : (
            formData.interests.map(interest => (
              <div 
                key={interest}
                className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full flex items-center"
              >
                {interest}
                <button 
                  type="button" 
                  onClick={() => handleRemoveInterest(interest)}
                  className="ml-1 rounded-full hover:bg-primary-100 p-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-2">Interest Categories</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(interestCategories).slice(0, 6).map(([category, interests]) => (
            <div key={category} className="mb-2">
              <p className="text-sm font-medium text-gray-700">{category}</p>
              <p className="text-xs text-gray-500">{interests.slice(0, 3).join(', ')}...</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

 