import React, { useState, useEffect } from 'react';
import { Card, Button, Collapse, Input, Checkbox, Radio, Select, message } from 'antd';
import { ImageUpload } from '../../components/ImageUpload';
import { CoverImageUpload } from '../../components/CoverImageUpload';
import { useGeolocation } from '../../hooks/useGeolocation';
import type { FormData } from '../../context/FormDataContext';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import { useState as useReactState } from 'react';

const { Panel } = Collapse;

const pronounOptions = [
  'He/Him',
  'She/Her',
  'They/Them',
  'Prefer not to say',
  'Custom',
];
const reasonOptions = [
  'Looking for activity partners',
  'Just moved to a new city',
  'Want to expand my social circle',
  'Other',
];
const interestOptions = [
  'Music', 'Sports', 'Art', 'Tech', 'Travel', 'Reading', 'Gaming', 'Cooking', 'Fitness', 'Photography',
];
const lightningCharacters = [
  'Hermione Granger',
  'Tony Stark',
  'Wonder Woman',
  'Sherlock Holmes',
  'Katniss Everdeen',
];
const hobbyOptions = [
  'Reading', 'Sports', 'Cooking', 'Travel', 'Music', 'Art', 'Gaming', 'Fitness', 'Photography', 'Dancing',
];
const activityOptions = [
  'Outdoor activities', 'Indoor activities', 'Cultural events', 'Sports events', 'Social gatherings', 'Volunteering',
];
const lifeStageOptions = [
  'College student', 'Working professional', 'Parent', 'Retired', 'New to area',
];
const scheduleOptions = [
  'Morning person', 'Night owl', 'Flexible', 'Regular 9-5', 'Shift work',
];
const socialSettingOptions = [
  'One-on-one meetups', 'Small groups', 'Large group events', 'Online chats only',
];
const timeOptions = [
  'Mornings', 'Afternoons', 'Evenings', 'Weekends',
];
const availabilityOptions = [
  'Daily', 'Weekly', 'Monthly',
];
const communicationStyleOptions = [
  'Texting', 'Phone Calls', 'Voice Notes', 'In-person only', 'Social Media', 'Email',
];
const dealbreakerOptions = [
  'Chronic flakiness', 'Gossip', 'Political discussions', 'Religious discussions', 'Substance use', 'Late night activities', 'Loud environments', 'Large crowds',
];
const preferenceOptions = [
  'Quiet environments', 'Small gatherings', 'Outdoor activities', 'Indoor activities', 'Early morning meetups', 'Weekend activities', 'Weekday activities', 'Online interactions',
];
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
  'Learning': ['Language exchange', 'Online courses', 'Skill sharing', 'Workshops', 'DIY Projects'],
};

interface EditProfileProps {
  initialValues: any;
  onSave: (values: any) => void;
  onCancel: () => void;
}

export const EditProfile: React.FC<EditProfileProps> = ({ initialValues, onSave, onCancel }) => {
  const [form, setForm] = useState<FormData>({
    name: initialValues.name || '',
    age: initialValues.age || 18,
    birthday: initialValues.birthday || '',
    bio: initialValues.bio || '',
    photoUrl: initialValues.photo_url || '',
    coverUrl: initialValues.cover_url || '',
    pronouns: initialValues.pronouns || '',
    reasonForJoining: initialValues.reason_for_joining || '',
    otherReason: '',
    interests: (initialValues.interests || []).map((i: any) => i.label || i) || [],
    location: initialValues.location || { latitude: 0, longitude: 0, city: '' },
    socialPreferences: initialValues.social_preferences || {
      looking_for: [],
      relationship_type: [],
      communicationStyle: [],
      socialSetting: '',
      times: [],
      availability: '',
    },
    lifestyle: initialValues.lifestyle || {
      hobbies: [],
      activities: [],
      schedule: '',
    },
    boundaries: initialValues.boundaries || {
      dealbreakers: [],
      preferences: [],
    },
    lightningRound: initialValues.lightning_round || {
      questions: [],
      fictionalCharacter: '',
    },
  });
  const [customPronouns, setCustomPronouns] = useState('');
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { latitude, longitude, city, error: geoError, loading: geoLoading } = useGeolocation();

  // Update location from geolocation
  useEffect(() => {
    if (latitude && longitude) {
      setForm(f => ({ ...f, location: { latitude, longitude, city: city || '' } }));
    }
  }, [latitude, longitude, city]);

  // Debug: Monitor form changes
  useEffect(() => {
    console.log('📝 Form state changed:', form);
    console.log('📝 Current photoUrl:', form.photoUrl);
  }, [form]);

  // Handlers
  const handleChange = (field: keyof FormData, value: any) => setForm(f => ({ ...f, [field]: value }));
  const handleNestedChange = (section: keyof FormData, field: string, value: any) => setForm(f => ({ ...f, [section]: { ...((f as any)[section]), [field]: value } }));
  const handleCheckboxGroup = (field: keyof FormData, list: any[]) => setForm(f => ({ ...f, [field]: list }));
  const handleNestedCheckboxGroup = (section: keyof FormData, field: string, list: any[]) => setForm(f => ({ ...f, [section]: { ...((f as any)[section]), [field]: list } }));

  const handlePhotoUpload = async (file: File) => {
    if (!initialValues.id) return;
    console.log('🚀 Starting photo upload for user:', initialValues.id);
    setIsUploading(true);
    try {
      const { profileService } = await import('../../services/profileService');
      console.log('📤 Calling profileService.uploadProfilePhoto...');
      const result = await profileService.uploadProfilePhoto(initialValues.id, file);
      
      console.log('🔍 Raw result from service:', result);
      console.log('🔍 Result type:', typeof result);
      console.log('🔍 Result keys:', Object.keys(result || {}));
      
      // Backend returns { photoUrl: "url_string" }
      const photoUrl = result?.photoUrl || result?.url || '';
      
      console.log('🔍 Extracted photoUrl:', photoUrl);
      console.log('🔍 Current form state before update:', form);
      
      setForm(f => {
        const newForm = { ...f, photoUrl };
        console.log('🔄 Form state after update:', newForm);
        return newForm;
      });
      
      console.log('✅ Form updated with new photoUrl:', photoUrl);
      
      // Force re-render by updating a timestamp
      setForm(f => ({ ...f, photoUrl, _timestamp: Date.now() }));
      
      message.success('Photo uploaded!');
    } catch (e: any) {
      console.error('Error uploading photo:', e);
      if (e?.response?.status === 413) {
        message.error('File size is too large. Please choose an image smaller than 5MB.');
      } else if (e?.response?.data?.error) {
        message.error(e.response.data.error);
      } else {
        message.error('Failed to upload photo');
      }
    } finally {
      setIsUploading(false);
    }
  };
  const handleCoverUpload = async (coverUrl: string) => {
    setForm(f => ({ ...f, coverUrl }));
    if (coverUrl) {
      message.success('Cover image uploaded!');
    } else {
      message.success('Cover image removed!');
    }
  };
  // Save handler: map to backend structure
  const handleSave = () => {
    setSaving(true);
    const mappedInterests = form.interests.map((i: string) => ({ id: i, label: i }));
    const lightning_round = {
      ...form.lightningRound,
      fictionalCharacter: form.lightningRound.fictionalCharacter,
    };
    const payload = {
      name: form.name,
      pronouns: form.pronouns === 'Custom' ? customPronouns : form.pronouns,
      age: form.age,
      birthday: form.birthday ? form.birthday : null,
      bio: form.bio,
      photo_url: form.photoUrl,
      cover_url: form.coverUrl,
      reason_for_joining: form.reasonForJoining === 'Other' ? form.otherReason : form.reasonForJoining,
      interests: mappedInterests,
      location: form.location,
      social_preferences: form.socialPreferences,
      lifestyle: form.lifestyle,
      boundaries: form.boundaries,
      lightning_round,
    };
    onSave(payload);
    setSaving(false);
    // message.success('Profile saved!');
  };

  return (
    <Card title="Edit Profile" style={{ maxWidth: 800, margin: '0 auto' }}>
      <Collapse defaultActiveKey={['personal', 'interests', 'social', 'lifestyle', 'boundaries', 'lightning']} accordion={false}>
        {/* Personal Info */}
        <Panel header="Personal Info" key="personal">
          <CoverImageUpload
            currentImage={form.coverUrl}
            onUpload={handleCoverUpload}
            isLoading={isUploading}
            userId={initialValues.id}
          />
          <ImageUpload
            currentImage={form.photoUrl}
            onUpload={handlePhotoUpload}
            isLoading={isUploading}
          />
          {/* Debug info */}
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Debug: form.photoUrl = "{form.photoUrl}" (type: {typeof form.photoUrl})
          </div>
          <Input
            placeholder="Name"
            value={form.name}
            onChange={e => handleChange('name', e.target.value)}
            style={{ marginBottom: 8 }}
          />
          <Select
            placeholder="Pronouns"
            value={form.pronouns}
            onChange={v => handleChange('pronouns', v)}
            style={{ marginBottom: 8, width: '100%' }}
            options={pronounOptions.map(p => ({ value: p, label: p }))}
          />
          {form.pronouns === 'Custom' && (
            <Input
              placeholder="Custom Pronouns"
              value={customPronouns}
              onChange={e => setCustomPronouns(e.target.value)}
              style={{ marginBottom: 8 }}
            />
          )}
          <Input.TextArea
            placeholder="Bio"
            value={form.bio}
            onChange={e => handleChange('bio', e.target.value)}
            style={{ marginBottom: 8 }}
          />
          <Input
            placeholder="Age"
            type="number"
            value={form.age}
            onChange={e => handleChange('age', parseInt(e.target.value))}
            style={{ marginBottom: 8 }}
            min={18}
            max={100}
          />
          <Input
            placeholder="Birthday"
            type="date"
            value={form.birthday || ''}
            onChange={e => handleChange('birthday', e.target.value)}
            style={{ marginBottom: 8 }}
            max={new Date().toISOString().split('T')[0]}
          />
          {/* Location */}
          <Input
            placeholder="City"
            value={form.location.city || ''}
            onChange={e => setForm(f => ({ ...f, location: { ...f.location, city: e.target.value } }))}
            style={{ marginBottom: 8 }}
          />
          <Input
            placeholder="Latitude"
            value={form.location.latitude || ''}
            onChange={e => setForm(f => ({ ...f, location: { ...f.location, latitude: parseFloat(e.target.value) || 0 } }))}
            style={{ marginBottom: 8 }}
          />
          <Input
            placeholder="Longitude"
            value={form.location.longitude || ''}
            onChange={e => setForm(f => ({ ...f, location: { ...f.location, longitude: parseFloat(e.target.value) || 0 } }))}
            style={{ marginBottom: 8 }}
          />
          {/* Reason for joining */}
          <Select
            placeholder="Reason for joining"
            value={form.reasonForJoining}
            onChange={v => handleChange('reasonForJoining', v)}
            style={{ marginBottom: 8, width: '100%' }}
            options={reasonOptions.map(r => ({ value: r, label: r }))}
          />
          {form.reasonForJoining === 'Other' && (
            <Input
              placeholder="Please specify"
              value={form.otherReason}
              onChange={e => handleChange('otherReason', e.target.value)}
              style={{ marginBottom: 8 }}
            />
          )}
        </Panel>
        {/* Interests */}
        <Panel header="Interests" key="interests">
          {/* Tag input with add/remove/search */}
          <InterestsTagInput
            value={form.interests}
            onChange={list => handleCheckboxGroup('interests', list)}
            categories={interestCategories}
          />
        </Panel>
        {/* Social Preferences */}
        <Panel header="Social Preferences" key="social">
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>What are you looking for?</div>
            <Checkbox.Group
              options={['Activity Partners', 'Friendship', 'Professional Network', 'Study Groups', 'Travel Buddies', 'Support Group']}
              value={form.socialPreferences.looking_for}
              onChange={list => handleNestedCheckboxGroup('socialPreferences', 'looking_for', list as string[])}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>Relationship Type</div>
            <Checkbox.Group
              options={['Casual Friends', 'Close Friends', 'Professional', 'Mentorship', 'Activity Partners', 'Support Network']}
              value={form.socialPreferences.relationship_type}
              onChange={list => handleNestedCheckboxGroup('socialPreferences', 'relationship_type', list as string[])}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>Preferred social setting</div>
            <Radio.Group
              options={socialSettingOptions}
              value={form.socialPreferences.socialSetting}
              onChange={e => handleNestedChange('socialPreferences', 'socialSetting', e.target.value)}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>Preferred time for socializing</div>
            <Checkbox.Group
              options={timeOptions}
              value={form.socialPreferences.times}
              onChange={list => handleNestedCheckboxGroup('socialPreferences', 'times', list as string[])}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>Frequency of availability</div>
            <Select
              placeholder="Select how often you're available"
              value={form.socialPreferences.availability}
              onChange={v => handleNestedChange('socialPreferences', 'availability', v)}
              style={{ width: '100%' }}
              options={availabilityOptions.map(a => ({ value: a, label: a }))}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>Communication Style</div>
            <Select
              placeholder="Select your preferred communication style"
              value={form.socialPreferences.communicationStyle}
              onChange={v => handleNestedChange('socialPreferences', 'communicationStyle', v)}
              style={{ width: '100%' }}
              options={communicationStyleOptions.map(c => ({ value: c, label: c }))}
            />
          </div>
        </Panel>
        {/* Lifestyle */}
        <Panel header="Lifestyle" key="lifestyle">
          {/* Life Stage (checkbox group) */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>Life Stage</div>
            <Checkbox.Group
              options={lifeStageOptions}
              value={form.lifestyle.lifeStage || []}
              onChange={list => handleNestedCheckboxGroup('lifestyle', 'lifeStage', list as string[])}
            />
          </div>
          {/* Hobbies (checkbox group) */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>Hobbies</div>
            <Checkbox.Group
              options={hobbyOptions}
              value={form.lifestyle.hobbies}
              onChange={list => handleNestedCheckboxGroup('lifestyle', 'hobbies', list as string[])}
            />
          </div>
          {/* Activities (checkbox group) */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>Activities</div>
            <Checkbox.Group
              options={activityOptions}
              value={form.lifestyle.activities}
              onChange={list => handleNestedCheckboxGroup('lifestyle', 'activities', list as string[])}
            />
          </div>
          {/* Schedule (select) */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>Schedule</div>
            <Select
              placeholder="Select your typical schedule"
              value={form.lifestyle.schedule}
              onChange={v => handleNestedChange('lifestyle', 'schedule', v)}
              style={{ width: '100%' }}
              options={scheduleOptions.map(s => ({ value: s, label: s }))}
            />
          </div>
        </Panel>
        {/* Boundaries */}
        <Panel header="Boundaries" key="boundaries">
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>Deal Breakers</div>
            <Checkbox.Group
              options={dealbreakerOptions}
              value={form.boundaries.dealbreakers}
              onChange={list => handleNestedCheckboxGroup('boundaries', 'dealbreakers', list as string[])}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>Preferences</div>
            <Checkbox.Group
              options={preferenceOptions}
              value={form.boundaries.preferences}
              onChange={list => handleNestedCheckboxGroup('boundaries', 'preferences', list as string[])}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>Additional Boundaries or Preferences</div>
            <Input.TextArea
              placeholder="Add any other boundaries or preferences not listed above"
              value={form.boundaries.preferences.filter(p => !preferenceOptions.includes(p)).join(', ')}
              onChange={e => handleNestedChange('boundaries', 'preferences', [
                ...form.boundaries.preferences.filter(p => preferenceOptions.includes(p)),
                ...e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              ])}
              rows={4}
            />
          </div>
        </Panel>
        {/* Lightning Round */}
        <Panel header="Lightning Round" key="lightning">
          <Radio.Group
            options={lightningCharacters}
            value={form.lightningRound.fictionalCharacter}
            onChange={e => setForm(f => ({ ...f, lightningRound: { ...f.lightningRound, fictionalCharacter: e.target.value } }))}
          />
        </Panel>
      </Collapse>
      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button type="primary" onClick={handleSave} loading={saving}>Save</Button>
      </div>
    </Card>
  );
};

export default EditProfile;

// Tag input for interests
const InterestsTagInput = ({ value, onChange, categories }: { value: string[]; onChange: (v: string[]) => void; categories: Record<string, string[]> }) => {
  const [search, setSearch] = useReactState('');
  const allInterests = Object.values(categories).flat();
  const filtered = search ? allInterests.filter(i => i.toLowerCase().includes(search.toLowerCase())) : [];
  return (
    <div>
      <Input
        placeholder="Search interests or type your own"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 8 }}
        suffix={<PlusOutlined onClick={() => {
          if (search && !value.includes(search) && value.length < 10) {
            onChange([...value, search]);
            setSearch('');
          }
        }} />}
      />
      {search && filtered.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          {filtered.map(interest => (
            <Button
              key={interest}
              size="small"
              style={{ marginRight: 4, marginBottom: 4 }}
              disabled={value.includes(interest) || value.length >= 10}
              onClick={() => {
                if (!value.includes(interest) && value.length < 10) {
                  onChange([...value, interest]);
                  setSearch('');
                }
              }}
            >
              <PlusOutlined /> {interest}
            </Button>
          ))}
        </div>
      )}
      <div style={{ marginBottom: 8 }}>
        {value.map(interest => (
          <span key={interest} style={{ display: 'inline-flex', alignItems: 'center', background: '#f0f0f0', borderRadius: 16, padding: '2px 8px', marginRight: 4, marginBottom: 4 }}>
            {interest}
            <CloseOutlined style={{ marginLeft: 4, cursor: 'pointer' }} onClick={() => onChange(value.filter(i => i !== interest))} />
          </span>
        ))}
        <span style={{ color: '#888', marginLeft: 8 }}>({value.length}/10)</span>
      </div>
      <div style={{ marginTop: 16, background: '#fafafa', borderRadius: 8, padding: 8 }}>
        <div style={{ fontWeight: 500, marginBottom: 4 }}>Interest Categories</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {Object.entries(categories).slice(0, 6).map(([cat, interests]) => (
            <div key={cat} style={{ minWidth: 120 }}>
              <div style={{ fontWeight: 500, fontSize: 12 }}>{cat}</div>
              <div style={{ fontSize: 11, color: '#888' }}>{interests.slice(0, 3).join(', ')}...</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 