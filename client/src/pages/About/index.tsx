import { Users, Heart, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const About = () => {
  const { effectiveTheme, currentColor, getFontSizeClassForElement } = useTheme();
  return (

    <div className={`container mx-auto px-4 py-12 min-h-screen ${effectiveTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <h1 className={`${getFontSizeClassForElement('text-3xl')} font-bold text-center ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'} mb-8`}>About Strictly Friendly</h1>
      <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-8 mb-12`}>
        <h2 className={`${getFontSizeClassForElement('text-2xl')} font-semibold ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'} mb-4`}>Our Mission</h2>
        <p className={`${getFontSizeClassForElement('text-base')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
          At Strictly Friendly, we believe that meaningful friendships are essential to a fulfilling life. In today's digital world, it can be challenging to make genuine connections, especially when many social platforms blur the lines between friendship and dating.
        </p>
        <p className={`${getFontSizeClassForElement('text-base')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
          Our mission is to create a safe, respectful space dedicated solely to helping people form platonic friendships based on shared interests, values, and lifestyles. Whether you've moved to a new city, are traveling for work or leisure, are looking to expand your social circle, or simply want to connect with like-minded individuals, Strictly Friendly is designed to help you build authentic relationships.
        </p>
        <div className="flex justify-center my-8">
          <img
            src="https://readdy.ai/api/search-image?query=diverse%20group%20of%20friends%20of%20different%20ages%20and%20backgrounds%20sitting%20in%20a%20circle%20at%20a%20park%2C%20sharing%20stories%20and%20laughing%20together%2C%20warm%20natural%20lighting%2C%20soft%20background%2C%20high%20quality%2C%20photorealistic%2C%208k%2C%20friendship%20concept&width=700&height=400&seq=about1&orientation=landscape"
            alt="Diverse group of friends"
            className="rounded-lg shadow-md"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
          <h2 className={`${getFontSizeClassForElement('text-xl')} font-semibold ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'} mb-4`}>What Sets Us Apart</h2>
          <ul className="space-y-3">

            <li className="flex items-start">
              <i className={`fas fa-check-circle text-${currentColor.primary} mt-1 mr-2`}></i>
              <span className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Interest-based matching that prioritizes compatibility</span>
            </li>
            <li className="flex items-start">
              <i className={`fas fa-check-circle text-${currentColor.primary} mt-1 mr-2`}></i>
              <span className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Clear boundaries and expectations for all users</span>
            </li>
            <li className="flex items-start">
              <i className={`fas fa-check-circle text-${currentColor.primary} mt-1 mr-2`}></i>
              <span className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Community-focused approach to friendship</span>
            </li>
            <li className="flex items-start">
              <i className={`fas fa-check-circle text-${currentColor.primary} mt-1 mr-2`}></i>
              <span className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Inclusive platform welcoming people of all backgrounds</span>
            </li>
          </ul>
        </div>
        <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
          <h2 className={`${getFontSizeClassForElement('text-xl')} font-semibold ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'} mb-4`}>Our Values</h2>
          <ul className="space-y-3">
            <li className="flex items-start">
              <i className="fas fa-heart text-red-500 mt-1 mr-2"></i>
              <span className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}><strong>Authenticity:</strong> We encourage genuine connections and honest communication.</span>
            </li>
            <li className="flex items-start">
              <i className="fas fa-shield-alt text-blue-500 mt-1 mr-2"></i>
              <span className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}><strong>Safety:</strong> We prioritize creating a secure environment for all users.</span>
            </li>
            <li className="flex items-start">
              <i className="fas fa-users text-purple-500 mt-1 mr-2"></i>
              <span className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}><strong>Inclusivity:</strong> We welcome diversity and respect individual differences.</span>
            </li>
            <li className="flex items-start">
              <i className="fas fa-handshake text-yellow-500 mt-1 mr-2"></i>
              <span className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}><strong>Respect:</strong> We expect all users to honor boundaries and treat others with dignity.</span>
            </li>
            <li className="flex items-start">
              <i className="fas fa-globe text-green-500 mt-1 mr-2"></i>
              <span className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}><strong>Community:</strong> We foster a sense of belonging and shared experiences.</span>
            </li>
          </ul>
        </div>
      </div>
      <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-indigo-50'} rounded-lg p-8 mb-12`}>
        <h2 className={`${getFontSizeClassForElement('text-2xl')} font-semibold ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'} mb-6 text-center`}>Our Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className={`${effectiveTheme === 'dark' ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow-md p-6 text-center`}>
            <img
              src="/assets/photos/Todd.png"
              alt="CEO"
              className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
            />
            <h3 className={`${getFontSizeClassForElement('text-lg')} font-semibold ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Todd Moeggenberg</h3>
            <p className={`${getFontSizeClassForElement('text-base')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Founder & CEO</p>
          </div>
          <div className={`${effectiveTheme === 'dark' ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow-md p-6 text-center`}>
            <img
              src="/assets/photos/Goran.webp"
              alt="CTO"
              className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
            />
            <h3 className={`${getFontSizeClassForElement('text-lg')} font-semibold ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Goran Jovic</h3>
            <p className={`${getFontSizeClassForElement('text-base')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Senior Lead Developer</p>
          </div>
          <div className={`${effectiveTheme === 'dark' ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow-md p-6 text-center`}>
            <img
              src="/assets/photos/Jonathan_Ballew.jpg"
              alt="COO"
              className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
            />
            <h3 className={`${getFontSizeClassForElement('text-lg')} font-semibold ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Jonathan Ballew</h3>
            <p className={`${getFontSizeClassForElement('text-base')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Senior Chief Advisor</p>
          </div>
        </div>
      </div>
      <div className="text-center mb-12">
        <h2 className={`${getFontSizeClassForElement('text-2xl')} font-semibold ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'} mb-6`}>Join Our Community</h2>
        <p className={`${getFontSizeClassForElement('text-base')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto mb-8`}>
          Ready to start making meaningful connections? Join Strictly Friendly today and discover a community of people who value authentic friendships just as much as you do.
        </p>
        <button
          className={`bg-${currentColor.primary} hover:bg-${currentColor.hover} text-white font-semibold py-3 px-8 rounded-full shadow-lg transition duration-300 ease-in-out !rounded-button whitespace-nowrap cursor-pointer ${getFontSizeClassForElement('text-base')}`}
        >
          <Link to={'/onboarding'}>
            Sign Up Now
          </Link>
        </button>
      </div>
    </div>
  );
};

export default About;
