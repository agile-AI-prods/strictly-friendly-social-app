import React from 'react';
import { Tabs } from 'antd';
import type { TabsProps } from 'antd';

const Overview = () => {
    const userProfile = {
        name: 'Jamie Smith',
        pronouns: 'They/Them',
        age: 30,
        city: 'Seattle, WA',
        reason: 'New to the city, looking to make local friends',
        interests: ['Hiking', 'Reading', 'Photography', 'Board Games', 'Cooking'],
        socialPreferences: {
            setting: 'Small groups',
            availability: 'Weekends',
            timeOfDay: 'Afternoons'
        },
        lifestyle: {
            values: ['Environmentalism', 'Inclusivity', 'Lifelong Learning'],
            lifeStage: 'Young Professional',
            onlineFriends: true
        },
        boundaries: {
            dealbreakers: 'Disrespectful behavior, flakiness',
            smoking: 'Non-smoker',
            drinking: 'Occasional'
        },
        avatar: 'https://readdy.ai/api/search-image?query=professional%20portrait%20photo%20of%20a%20friendly%20non-binary%20person%20with%20short%20hair%20and%20glasses%2C%20casual%20stylish%20outfit%2C%20natural%20lighting%2C%20soft%20background%2C%20high%20quality%2C%20photorealistic%2C%208k&width=200&height=200&seq=jamie1&orientation=squarish'
    };

    const items: TabsProps['items'] = [
        {
            key: 'overview',
            label: 'Overview',
            children: (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">About Me</h2>
                            <p className="text-gray-600">{userProfile.reason}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-gray-800">Interests</h2>
                                <button className="text-indigo-600 hover:text-indigo-800 text-sm !rounded-button whitespace-nowrap cursor-pointer">
                                    <i className="fas fa-edit"></i> Edit
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {userProfile.interests.map((interest, idx) => (
                                    <span
                                        key={idx}
                                        className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm"
                                    >
                                        {interest}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-gray-800">Social Preferences</h2>
                                <button className="text-indigo-600 hover:text-indigo-800 text-sm !rounded-button whitespace-nowrap cursor-pointer">
                                    <i className="fas fa-edit"></i> Edit
                                </button>
                            </div>
                            <div className="space-y-3">
                                <div className="flex">
                                    <div className="w-1/3 text-gray-600">Preferred Setting:</div>
                                    <div className="w-2/3 text-gray-800">{userProfile.socialPreferences.setting}</div>
                                </div>
                                <div className="flex">
                                    <div className="w-1/3 text-gray-600">Availability:</div>
                                    <div className="w-2/3 text-gray-800">{userProfile.socialPreferences.availability}</div>
                                </div>
                                <div className="flex">
                                    <div className="w-1/3 text-gray-600">Time of Day:</div>
                                    <div className="w-2/3 text-gray-800">{userProfile.socialPreferences.timeOfDay}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="bg-gray-50 rounded-lg p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-gray-800">Lifestyle & Values</h2>
                                <button className="text-indigo-600 hover:text-indigo-800 text-sm !rounded-button whitespace-nowrap cursor-pointer">
                                    <i className="fas fa-edit"></i> Edit
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-gray-600 mb-2">Values:</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {userProfile.lifestyle.values.map((value, idx) => (
                                            <span
                                                key={idx}
                                                className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                                            >
                                                {value}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-gray-600 mb-1">Life Stage:</h3>
                                    <p className="text-gray-800">{userProfile.lifestyle.lifeStage}</p>
                                </div>
                                <div>
                                    <h3 className="text-gray-600 mb-1">Open to Online Friends:</h3>
                                    <p className="text-gray-800">{userProfile.lifestyle.onlineFriends ? 'Yes' : 'No'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-gray-800">Boundaries</h2>
                                <button className="text-indigo-600 hover:text-indigo-800 text-sm !rounded-button whitespace-nowrap cursor-pointer">
                                    <i className="fas fa-edit"></i> Edit
                                </button>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <h3 className="text-gray-600 mb-1">Dealbreakers:</h3>
                                    <p className="text-gray-800">{userProfile.boundaries.dealbreakers}</p>
                                </div>
                                <div className="flex">
                                    <div className="w-1/3 text-gray-600">Smoking:</div>
                                    <div className="w-2/3 text-gray-800">{userProfile.boundaries.smoking}</div>
                                </div>
                                <div className="flex">
                                    <div className="w-1/3 text-gray-600">Drinking:</div>
                                    <div className="w-2/3 text-gray-800">{userProfile.boundaries.drinking}</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Account</h2>
                            <div className="space-y-2">
                                <a href="#" className="flex items-center text-gray-700 hover:text-indigo-600 py-2 cursor-pointer">
                                    <i className="fas fa-cog mr-3 w-5 text-center"></i> Account Settings
                                </a>
                                <a href="#" className="flex items-center text-gray-700 hover:text-indigo-600 py-2 cursor-pointer">
                                    <i className="fas fa-bell mr-3 w-5 text-center"></i> Notification Preferences
                                </a>
                                <a href="#" className="flex items-center text-gray-700 hover:text-indigo-600 py-2 cursor-pointer">
                                    <i className="fas fa-shield-alt mr-3 w-5 text-center"></i> Privacy Settings
                                </a>
                                <a href="#" className="flex items-center text-gray-700 hover:text-indigo-600 py-2 cursor-pointer">
                                    <i className="fas fa-question-circle mr-3 w-5 text-center"></i> Help Center
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'activities',
            label: 'Activities',
            children: <div>Activities Content</div>
        },
        {
            key: 'connections',
            label: 'Connections',
            children: <div>Connections Content</div>
        },
        {
            key: 'messages',
            label: 'Messages',
            children: <div>Messages Content</div>
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                <Tabs
                    defaultActiveKey="overview"
                    items={items}
                    className="bg-white rounded-lg shadow-md"
                />
            </div>
        </div>
    );
};

export default Overview;