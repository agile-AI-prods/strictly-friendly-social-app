import { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const Contact = () => {
  const { effectiveTheme, currentColor, getFontSizeClassForElement } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would send the form data to a backend
    console.log('Form submitted:', formData);
    setIsSubmitted(true);
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 ${effectiveTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="text-center mb-12">
        <h1 className={`${getFontSizeClassForElement('text-3xl')} font-bold ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Contact Us</h1>
        <p className={`mt-4 ${getFontSizeClassForElement('text-xl')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} max-w-3xl mx-auto`}>
          Have questions or suggestions? We'd love to hear from you!
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-8`}>
          <h2 className={`${getFontSizeClassForElement('text-2xl')} font-bold ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-6`}>Get in Touch</h2>

          {isSubmitted ? (
            <div className={`${effectiveTheme === 'dark' ? 'bg-green-900' : 'bg-green-50'} p-4 rounded-lg mb-6`}>
              <p className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-green-200' : 'text-green-800'} font-medium`}>Thank you for your message! We'll get back to you soon.</p>
            </div>
          ) : null}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className={`form-label ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className={`form-input ${effectiveTheme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                placeholder="Your name"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="email" className={`form-label ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={`form-input ${effectiveTheme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                placeholder="your.email@example.com"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="message" className={`form-label ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                className={`form-input min-h-[150px] ${effectiveTheme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                placeholder="How can we help you?"
              />
            </div>

            <button type="submit" className={`bg-${currentColor.primary} hover:bg-${currentColor.hover} text-white font-semibold py-3 px-6 rounded-lg transition duration-300 ease-in-out w-full flex justify-center items-center ${getFontSizeClassForElement('text-base')}`}>
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </button>
          </form>
        </div>

        <div>
          <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-primary-50'} rounded-lg p-8 mb-8`}>
            <h2 className={`${getFontSizeClassForElement('text-2xl')} font-bold ${effectiveTheme === 'dark' ? 'text-white' : 'text-primary-900'} mb-6`}>Contact Information</h2>

            <div className="space-y-4">
              <div className="flex items-start">
                <Mail className={`h-5 w-5 text-${currentColor.primary} mt-1 mr-3`} />
                <div>
                  <p className={`font-medium ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Email</p>
                  <a href="mailto:help@strictlyfriendly.com" className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} hover:underline hover:text-${currentColor.primary}`}>
                    help@strictlyfriendly.com
                  </a>
                </div>
              </div>

              {/* <div className="flex items-start">
                <Phone className="h-5 w-5 text-primary-700 mt-1 mr-3" />
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-gray-600">(573) 340-5798</p>
                </div>
              </div> */}

              <div className="flex items-start">
                <MapPin className={`h-5 w-5 text-${currentColor.primary} mt-1 mr-3`} />
                <div>
                  <p className={`font-medium ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Address</p>
                  <p className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>PO BOX 1612 LAKE OZARK,  MO 65049</p>
                </div>
              </div>
            </div>
          </div>

          <div className={`${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-8`}>
            <h2 className={`${getFontSizeClassForElement('text-2xl')} font-bold ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-6`}>FAQ</h2>

            <div className="space-y-6">
              <div>
                <h3 className={`font-semibold ${getFontSizeClassForElement('text-lg')} mb-2 ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Is Strictly Friendly really just for platonic friendships?</h3>
                <p className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Yes! We are specifically designed for people seeking non-romantic connections. Our platform helps match people based on shared interests and lifestyle compatibility.</p>
              </div>

              <div>
                <h3 className={`font-semibold ${getFontSizeClassForElement('text-lg')} mb-2 ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>How do you ensure user safety?</h3>
                <p className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>We have strict community guidelines, profile verification, and reporting tools. We also provide safety tips for meeting new friends in person.</p>
              </div>

              <div>
                <h3 className={`font-semibold ${getFontSizeClassForElement('text-lg')} mb-2 ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Is Strictly Friendly free to use?</h3>
                <p className={`${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Basic features are free. We also offer premium subscription options with enhanced matching and additional features.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
