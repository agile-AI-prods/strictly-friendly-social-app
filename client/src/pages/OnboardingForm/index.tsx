import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { updateProfile } from '../../store/slices/authSlice';
import { useFormData } from '../../context/FormDataContext';
import { PersonalInfo } from './steps/PersonalInfo';
import { Interests } from './steps/Interests';
import { SocialPreferences } from './steps/SocialPreferences';
import { Lifestyle } from './steps/Lifestyle';
import { Boundaries } from './steps/Boundaries';
import { LightningRound } from './steps/LightningRound';
import { ProgressBar } from '../../components/ProgressBar';
import { Button } from '../../components/Button';

const steps = [
  { id: 'personal', title: 'Personal Info' },
  { id: 'interests', title: 'Interests' },
  { id: 'social-preferences', title: 'Social Preferences' },
  { id: 'lifestyle', title: 'Lifestyle' },
  { id: 'boundaries', title: 'Boundaries' },
  { id: 'lightning-round', title: 'Lightning Round' }
];

export const OnboardingForm = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { formData, resetFormData } = useFormData();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // useEffect(() => {
  //   if (!user) {
  //     console.log('navigating to login page')
  //     navigate('/login');
  //   }
  // }, [user, navigate]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Prepare profile data for backend
      const profileData = {
        name: formData.name,
        pronouns: formData.pronouns,
        age: formData.age,
        birthday: formData.birthday,
        bio: formData.bio,
        location: formData.location,
        reason_for_joining: formData.reasonForJoining,
        photo_url: formData.photoUrl,
        cover_url: formData.coverUrl,
        interests: formData.interests.map(interest => ({ id: interest, label: interest })),
        social_preferences: formData.socialPreferences,
        lifestyle: formData.lifestyle,
        boundaries: formData.boundaries,
        lightning_round: formData.lightningRound
      };

      // Update profile using Redux thunk
      await dispatch(updateProfile({ userId: user.id, profileData })).unwrap();

      // Clear form data after successful submission
      resetFormData();

      navigate('/profile-summary');
    } catch (err: any) {
      setError(err || 'An error occurred while saving your profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <PersonalInfo />;
      case 1:
        return <Interests />;
      case 2:
        return <SocialPreferences />;
      case 3:
        return <Lifestyle />;
      case 4:
        return <Boundaries />;
      case 5:
        return <LightningRound />;
      default:
        return null;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            {steps[currentStep].title}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>

        <ProgressBar
          currentStep={currentStep + 1}
          totalSteps={steps.length}
        />

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="mt-8 bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {renderStep()}
          </div>

          <div className="px-4 py-3 bg-gray-50 sm:px-6 flex justify-between">
            <Button
              onClick={handleBack}
              disabled={currentStep === 0 || isSubmitting}
              variant="secondary"
            >
              Back
            </Button>

            {currentStep === steps.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                loading={isSubmitting}
              >
                {isSubmitting ? 'Saving Profile...' : 'Complete Profile'}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={isSubmitting}
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 