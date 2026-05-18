import { useNavigate } from "react-router-dom";
import { useTheme } from '../context/ThemeContext';
import { Facebook, Twitter, Instagram, Linkedin, Heart, Users, Shield, FileText } from 'lucide-react';

const Footer = () => {
  const navigate = useNavigate();
  const { effectiveTheme, currentColor, getFontSizeClassForElement } = useTheme();

  return (
    <footer className={`py-16 ${effectiveTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} border-t ${effectiveTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="max-w-7xl mx-auto px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-center lg:justify-start mb-6">
              {/* <div className={`w-12 h-12 rounded-xl bg-gradient-to-r from-${currentColor.primary} to-${currentColor.hover} flex items-center justify-center mr-4 shadow-lg`}>
                <Heart className="w-7 h-7 text-white" />
              </div> */}
              <h3 className={`${getFontSizeClassForElement('text-2xl')} font-bold ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Strictly Friendly
              </h3>
            </div>
            <p className={`${getFontSizeClassForElement('text-sm')} mb-8 leading-relaxed text-center lg:text-left ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Find your next real-life friend, not a fling. Connect with people who share your interests and values.
            </p>
            <div className="flex justify-center lg:justify-start space-x-4">
              <a href="https://www.facebook.com/share/1AromBHVue/" target="_blank" rel="noopener noreferrer"
                className={`p-3 rounded-xl ${effectiveTheme === 'dark' ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'} transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg`}>
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#"
                className={`p-3 rounded-xl ${effectiveTheme === 'dark' ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'} transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg`}>
                <i className="fa-brands fa-x-twitter"></i>
              </a>
              <a href="https://www.instagram.com/strictlyfriendly?igsh=MTY1d29iaHNrempqZw=="
                className={`p-3 rounded-xl ${effectiveTheme === 'dark' ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'} transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg`}>
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://www.linkedin.com/company/108091019"
                className={`p-3 rounded-xl ${effectiveTheme === 'dark' ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'} transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg`}>
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Company Section */}
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start mb-6">
              <i className="fas fa-user-friends mr-2"></i>
              <h3 className={`${getFontSizeClassForElement('text-lg')} font-semibold ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Company</h3>
            </div>
            <ul className="space-y-4">
              <li>
                <a href="#"
                  className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors duration-200 cursor-pointer block py-2 hover:scale-105 transform`}
                  onClick={() => navigate('/about')}>
                  About Us
                </a>
              </li>
              <li>
                <a href="mailto:careers@strictlyfriendly.com"
                  className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors duration-200 cursor-pointer block py-2 hover:scale-105 transform`}>
                  Careers
                </a>
              </li>
              <li>
                <a href="mailto:contact@strictlyfriendly.com"
                  className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors duration-200 cursor-pointer block py-2 hover:scale-105 transform`}
                  onClick={() => navigate('/contact')}>
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Support Section */}
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start mb-6">
              <Shield className={`w-6 h-6 mr-3 ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
              <h3 className={`${getFontSizeClassForElement('text-lg')} font-semibold ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Support</h3>
            </div>
            <ul className="space-y-4">
              <li>
                <a href="mailto:help@strictlyfriendly.com"
                  className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors duration-200 cursor-pointer block py-2 hover:scale-105 transform`}>
                  Help Center
                </a>
              </li>
              <li>
                <a href="mailto:safety@strictlyfriendly.com"
                  className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors duration-200 cursor-pointer block py-2 hover:scale-105 transform`}>
                  Safety Center
                </a>
              </li>
              <li>
                <a href="#"
                  className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors duration-200 cursor-pointer block py-2 hover:scale-105 transform`}>
                  Community Guidelines
                </a>
              </li>
              <li>
                <a href="mailto:feedback@strictlyfriendly.com"
                  className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors duration-200 cursor-pointer block py-2 hover:scale-105 transform`}>
                  Feedback
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Section */}
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start mb-6">
              <FileText className={`w-6 h-6 mr-3 ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
              <h3 className={`${getFontSizeClassForElement('text-lg')} font-semibold ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Legal</h3>
            </div>
            <ul className="space-y-4">
              <li>
                <a href="#"
                  className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors duration-200 cursor-pointer block py-2 hover:scale-105 transform`}>
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#"
                  className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors duration-200 cursor-pointer block py-2 hover:scale-105 transform`}>
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#"
                  className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors duration-200 cursor-pointer block py-2 hover:scale-105 transform`}>
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className={`pt-10 border-t ${effectiveTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              © 2025 Strictly Friendly. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
