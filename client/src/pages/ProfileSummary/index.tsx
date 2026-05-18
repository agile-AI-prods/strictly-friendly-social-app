import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { Edit, CheckCircle, ChevronRight, ArrowLeft } from 'lucide-react';

const ProfileSummary = () => {
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  
  // Use the user profile data from Redux instead of form data
  const profile = user;
  
  console.log('Profile data:', profile);

  const handleEditSection = (stepNumber: number) => {
    // Navigate to profile edit instead of onboarding
    navigate(`/profile/${user?.id}?edit=true`);
  };

  const renderSection = (title: string, data: React.ReactNode, stepNumber: number) => (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button
          type="button"
          onClick={() => handleEditSection(stepNumber)}
          className="text-primary-600 hover:text-primary-800 flex items-center text-sm font-medium"
        >
          <Edit className="h-4 w-4 mr-1" /> Edit
        </button>
      </div>
      <div className="space-y-4">
        {data}
      </div>
    </div>
  );

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-primary-50 rounded-lg p-6 mb-8 text-center">
        <CheckCircle className="h-12 w-12 text-primary-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Complete!</h1>
        <p className="text-gray-700">
          Thanks for sharing your preferences. Here's a summary of your profile.
        </p>
      </div>

      {renderSection("Personal Details", (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{profile.name}</p>
            </div>
            {profile.pronouns && (
              <div>
                <p className="text-sm text-gray-500">Pronouns</p>
                <p className="font-medium">{profile.pronouns}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Age</p>
              <p className="font-medium">{profile.age}</p>
            </div>
            {/* Birthday is always shown in ProfileSummary since user is viewing their own profile */}
            {profile.birthday && (
              <div>
                <p className="text-sm text-gray-500">Birthday</p>
                <p className="font-medium">{new Date(profile.birthday).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="font-medium">
                {profile.location?.latitude?.toFixed(4)}, {profile.location?.longitude?.toFixed(4)}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-500">Reason for joining</p>
              <p className="font-medium">
                {profile.reason_for_joining === 'Other' 
                  ? profile.other_reason 
                  : profile.reason_for_joining}
              </p>
            </div>
          </div>
        </>
      ), 1)}

      {renderSection("Interests", (
        <>
          <p className="text-sm text-gray-500 mb-2">Selected Interests ({profile.interests?.length || 0})</p>
          <div className="flex flex-wrap gap-2">
            {profile.interests?.map((interest: any) => (
              <span key={interest.id || interest} className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm">
                {interest.label || interest}
              </span>
            ))}
          </div>
        </>
      ), 2)}

      {renderSection("Social Preferences", (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Looking for</p>
              <p className="font-medium">
                {Array.isArray(profile.social_preferences?.looking_for) 
                  ? profile.social_preferences.looking_for.join(', ') 
                  : 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Relationship type</p>
              <p className="font-medium">
                {Array.isArray(profile.social_preferences?.relationship_type) 
                  ? profile.social_preferences.relationship_type.join(', ') 
                  : 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Communication style</p>
              <p className="font-medium">
                {Array.isArray(profile.social_preferences?.communicationStyle) 
                  ? profile.social_preferences.communicationStyle.join(', ') 
                  : profile.social_preferences?.communicationStyle || 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Social setting</p>
              <p className="font-medium">{profile.social_preferences?.socialSetting || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Preferred times</p>
              <p className="font-medium">
                {Array.isArray(profile.social_preferences?.times) 
                  ? profile.social_preferences.times.join(', ') 
                  : 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Availability</p>
              <p className="font-medium">{profile.social_preferences?.availability || 'Not specified'}</p>
            </div>
          </div>
        </>
      ), 3)}

      {renderSection("Lifestyle", (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Hobbies</p>
              <p className="font-medium">
                {Array.isArray(profile.lifestyle?.hobbies) 
                  ? profile.lifestyle.hobbies.join(', ') 
                  : 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Activities</p>
              <p className="font-medium">
                {Array.isArray(profile.lifestyle?.activities) 
                  ? profile.lifestyle.activities.join(', ') 
                  : 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Schedule</p>
              <p className="font-medium">{profile.lifestyle?.schedule || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Life stage</p>
              <p className="font-medium">
                {Array.isArray(profile.lifestyle?.lifeStage) 
                  ? profile.lifestyle.lifeStage.join(', ') 
                  : 'Not specified'}
              </p>
            </div>
          </div>
        </>
      ), 4)}

      {renderSection("Boundaries", (
        <>
          <div className="space-y-4">
            {profile.boundaries && (
              <div>
                <p className="text-sm text-gray-500">Behaviors/topics to avoid</p>
                <p className="font-medium">
                  {Array.isArray(profile.boundaries.dealbreakers) 
                    ? profile.boundaries.dealbreakers.join(', ') 
                    : 'None specified'}
                </p>
              </div>
            )}
            {profile.boundaries && (
              <div>
                <p className="text-sm text-gray-500">Preferences</p>
                <p className="font-medium">
                  {Array.isArray(profile.boundaries.preferences) 
                    ? profile.boundaries.preferences.join(', ') 
                    : 'None specified'}
                </p>
              </div>
            )}
          </div>
        </>
      ), 5)}

      {profile.lightning_round?.fictionalCharacter && renderSection("Lightning Round", (
        <>
          <div>
            <p className="text-sm text-gray-500">Character you'd befriend</p>
            <p className="font-medium">{profile.lightning_round.fictionalCharacter}</p>
          </div>
        </>
      ), 6)}

      <div className="flex space-x-4 mt-8">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="btn btn-outline flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Home
        </button>
        <button
          type="button"
          className="btn btn-primary flex items-center"
          onClick={() => window.alert("In a complete app, this would submit your profile to our matching system!")}
        >
          Find Friends <ChevronRight className="h-4 w-4 ml-1" />
        </button>
      </div>
    </div>
  );
};

export default ProfileSummary;
 