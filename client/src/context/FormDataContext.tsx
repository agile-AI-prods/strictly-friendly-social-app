import { createContext, useContext, useState, ReactNode } from 'react';

interface SocialPreferences {
  looking_for: string[];
  relationship_type: string[];
  // communication_style: string[];
  socialSetting?: string;
  times?: string[];
  availability?: string;
  communicationStyle?: string[];
}

interface Lifestyle {
  hobbies: string[];
  activities: string[];
  schedule: string;
  lifeStage?: string[];
}

interface Boundaries {
  dealbreakers: string[];
  preferences: string[];
}

interface LightningRound {
  questions: Array<{
    question: string;
    answer: string;
  }>;
  fictionalCharacter?: string;
}

export interface FormData {
  name: string;
  age: number;
  birthday?: string; // ISO date string (YYYY-MM-DD)
  bio: string;
  photoUrl: string;
  coverUrl: string;
  pronouns?: string;
  reasonForJoining?: string;
  otherReason?: string;
  // values?: string[];
  interests: string[];
  location: {
    latitude: number;
    longitude: number;
    city: string;
  };
  socialPreferences: SocialPreferences;
  lifestyle: Lifestyle;
  boundaries: Boundaries;
  lightningRound: LightningRound;
}

interface FormDataContextType {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  resetFormData: () => void;
  setCurrentStep: (step: number) => void;
}

const initialFormData: FormData = {
  name: '',
  age: 18,
  birthday: '',
  bio: '',
  photoUrl: '',
  coverUrl: '',
  pronouns: '',
  reasonForJoining: '',
  otherReason: '',
  // values: [],
  interests: [],
  location: {
    latitude: 0,
    longitude: 0,
    city: ""
  },
  socialPreferences: {
    availability: '',
    looking_for: [],
    relationship_type: [],
    communicationStyle: []
  },
  lifestyle: {
    hobbies: [],
    activities: [],
    schedule: ''
  },
  boundaries: {
    dealbreakers: [],
    preferences: []
  },
  lightningRound: {
    questions: [],
    fictionalCharacter: ''
  }
};

const FormDataContext = createContext<FormDataContextType | undefined>(undefined);

export const FormDataProvider = ({ children }: { children: ReactNode }) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(0);

  const updateFormData = (data: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const resetFormData = () => {
    setFormData(initialFormData);
  };

  return (
    <FormDataContext.Provider value={{ formData, updateFormData, resetFormData, setCurrentStep }}>
      {children}
    </FormDataContext.Provider>
  );
};

export const useFormData = () => {
  const context = useContext(FormDataContext);
  if (context === undefined) {
    throw new Error('useFormData must be used within a FormDataProvider');
  }
  return context;
};
