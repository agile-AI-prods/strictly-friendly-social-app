import { Link } from 'react-router-dom';
import { Pagination, Autoplay, Parallax } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { useEffect, useRef, Suspense } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useTheme } from '../../context/ThemeContext';
import { getClientIP } from '../../utils/ipUtils';
import { recordDeviceLogin } from '../../api/deviceManagementApi';
import './style.css'
import 'swiper/css';
import 'swiper/css/pagination';

const lifestyleImages = [
  {
    url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f",
    alt: "Diverse group of friends collaborating at a table"
  },
  {
    url: "https://images.unsplash.com/photo-1498661694102-0a3793edbe74",
    alt: "Group of women friends standing on rock formation"
  },
  {
    url: "https://images.unsplash.com/photo-1524601500432-1e1a4c71d692",
    alt: "Women forming heart gestures in a wheat field"
  },
  {
    url: "https://images.unsplash.com/photo-1466695108335-44674aa2058b",
    alt: "Three women looking at body of water"
  },
  {
    url: "https://images.unsplash.com/photo-1511988617509-a57c8a288659",
    alt: "Friends at a sporting event"
  },
  {
    url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac",
    alt: "Friends celebrating together"
  },
  {
    url: "https://readdy.ai/api/search-image?query=diverse%20group%20of%20happy%20friends%20hanging%20out%20together%20in%20a%20park%2C%20laughing%20and%20enjoying%20each%20others%20company%2C%20warm%20natural%20lighting%2C%20soft%20bokeh%20background%2C%20high%20quality%2C%20photorealistic%2C%208k%2C%20friendship%20concept&width=600&height=500&seq=hero1&orientation=landscape",
    alt: "Friends enjoying time together"
  }
];

const Home = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { effectiveTheme, currentColor, getFontSizeClassForElement } = useTheme();
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const scrolled = window.pageYOffset;
        const rate = scrolled * 0.5;
        heroRef.current.style.transform = `translate3d(0, ${rate}px, 0)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Device Management - trigger after Home page is loaded and user is authenticated
  useEffect(() => {
    if (user?.email) {
      // Reduced delay for faster execution
      const deviceManagementTimer = setTimeout(async () => {
        try {
          const clientIP = await getClientIP();
          await recordDeviceLogin(clientIP || undefined);
        } catch (error) {
          console.error('Device management failed:', error);
        }
      }, 500); // Reduced from 1000ms to 500ms

      return () => clearTimeout(deviceManagementTimer);
    }
  }, [user?.email]);

  return (
    <div className={`min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${
      effectiveTheme === 'dark' ? 'bg-gray-900' : 'bg-white'
    }`}>
      <div className={`relative overflow-hidden ${
        effectiveTheme === 'dark' 
          ? 'bg-gradient-to-r from-gray-800 to-gray-900' 
          : 'bg-gradient-to-r from-indigo-50 to-indigo-100'
      }`}>
        <div className="container w-full relative h-screen overflow-hidden mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center">
          <div
            ref={heroRef}
            className="absolute inset-0 w-full h-full parallax-container"
          >
            <Suspense fallback={
              <div className="w-full h-full bg-gradient-to-r from-indigo-50 to-indigo-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            }>
            <Swiper
              modules={[Pagination, Autoplay, Parallax]}
              pagination={{ clickable: true }}
              autoplay={{ delay: 5000 }}
              loop={true}
              parallax={true}
              speed={1200}
              effect="fade"
              className="w-full h-full hero-swiper"
            >
              {lifestyleImages.map((image, index) => (
                <SwiperSlide key={index} className="w-full h-full">
                  <div className="relative w-full h-full overflow-hidden">
                    <div
                      className="swiper-parallax-bg"
                      style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backgroundImage: `url(${image.url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        willChange: 'transform',
                      }}
                      data-swiper-parallax-duration="1200"
                    ></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-900/20 via-orange-800/10 to-rose-900/10"></div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
            </Suspense>
          </div>
          <div className=" z-10 relative flex justify-center items-center">
            <div className="md:w-2/3 mx-auto px-4 sm:px-6 lg:px-8">

              <h1 className={`text-3xl sm:text-4xl md:text-5xl text-white font-bold mb-4 sm:mb-6 leading-tight ${getFontSizeClassForElement('text-3xl')}`}>New friends, real vibes — no swipes, just high fives.</h1>
              <p className={`text-base sm:text-lg text-white mb-6 sm:mb-8 leading-relaxed ${getFontSizeClassForElement('text-base')}`}>Connect with like-minded people who share your interests and are looking for genuine friendships.</p>
              <Link
                to={'/onboarding'}
                className={`bg-${currentColor.primary} hover:bg-${currentColor.hover} text-white font-semibold py-3 px-6 sm:px-8 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 !rounded-button whitespace-nowrap cursor-pointer ${getFontSizeClassForElement('text-sm')}`}
              >
                  Get Started
                </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <h2 className={`text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 ${getFontSizeClassForElement('text-2xl')} ${
          effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'
        }`}>How Strictly Friendly Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className={`p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow ${
            effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`mb-4 flex justify-center text-${currentColor.primary}`}>
              <i className="fas fa-user-plus text-4xl sm:text-5xl"></i>
            </div>
            <h3 className={`text-lg sm:text-xl font-semibold mb-2 text-center ${getFontSizeClassForElement('text-lg')} ${
              effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>Create Your Profile</h3>
            <p className={`text-center text-sm sm:text-base ${getFontSizeClassForElement('text-sm')} ${
              effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>Tell us about yourself, your interests, and what you're looking for in friendships.</p>
          </div>
          <div className={`p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow ${
            effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`mb-4 flex justify-center text-${currentColor.primary}`}>
              <i className="fas fa-compass text-4xl sm:text-5xl"></i>
            </div>
            <h3 className={`text-lg sm:text-xl font-semibold mb-2 text-center ${getFontSizeClassForElement('text-lg')} ${
              effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>Discover People</h3>
            <p className={`text-center text-sm sm:text-base ${getFontSizeClassForElement('text-sm')} ${
              effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>Find like-minded individuals in your area who share your interests and values.</p>
          </div>
          <div className={`p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow ${
            effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`mb-4 flex justify-center text-${currentColor.primary}`}>
              <i className="fas fa-handshake text-4xl sm:text-5xl"></i>
            </div>
            <h3 className={`text-lg sm:text-xl font-semibold mb-2 text-center ${getFontSizeClassForElement('text-lg')} ${
              effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>Connect & Meet</h3>
            <p className={`text-center text-sm sm:text-base ${getFontSizeClassForElement('text-sm')} ${
              effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>Start conversations, plan activities, and build meaningful friendships.</p>
          </div>
        </div>
      </div>
      <div className={`py-12 sm:py-16 ${
        effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-indigo-50'
      }`}>
        <div className="container mx-auto px-4">
          <h2 className={`text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 ${getFontSizeClassForElement('text-2xl')} ${
            effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>What Our Users Say</h2>
          <div className="max-w-4xl mx-auto">
            <Swiper
              modules={[Pagination, Autoplay]}
              pagination={{ clickable: true }}
              autoplay={{ delay: 5000 }}
              spaceBetween={20}
              slidesPerView={1}
              className="w-full"
            >
              <SwiperSlide className="w-full">
                <div className={`p-6 sm:p-8 rounded-lg shadow-md ${
                  effectiveTheme === 'dark' ? 'bg-gray-700' : 'bg-white'
                }`}>
                  <div className="flex items-center mb-4">
                    <img
                      src="https://readdy.ai/api/search-image?query=professional%20portrait%20photo%20of%20a%20friendly%20woman%20with%20short%20blonde%20hair%2C%20natural%20lighting%2C%20soft%20background%2C%20high%20quality%2C%20photorealistic%2C%208k&width=60&height=60&seq=test1&orientation=squarish"
                      alt="User"
                      className="w-12 h-12 rounded-full mr-4 object-cover"
                    />
                    <div>
                      <h4 className={`font-semibold ${getFontSizeClassForElement('text-base')} ${
                        effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'
                      }`}>Sarah J.</h4>
                      <p className={`text-sm ${getFontSizeClassForElement('text-sm')} ${
                        effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                      }`}>Seattle, WA</p>
                    </div>
                  </div>
                  <p className={`italic text-sm sm:text-base ${getFontSizeClassForElement('text-sm')} ${
                    effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>"After moving to a new city, I was feeling lonely and isolated. Strictly Friendly helped me connect with people who share my love for hiking and photography. I've made three close friends in just two months!"</p>
                </div>
              </SwiperSlide>
              <SwiperSlide className="w-full">
                <div className={`p-6 sm:p-8 rounded-lg shadow-md ${
                  effectiveTheme === 'dark' ? 'bg-gray-700' : 'bg-white'
                }`}>
                  <div className="flex items-center mb-4">
                    <img
                      src="https://readdy.ai/api/search-image?query=professional%20portrait%20photo%20of%20a%20friendly%20man%20with%20glasses%20and%20beard%2C%20natural%20lighting%2C%20soft%20background%2C%20high%20quality%2C%20photorealistic%2C%208k&width=60&height=60&seq=test2&orientation=squarish"
                      alt="User"
                      className="w-12 h-12 rounded-full mr-4 object-cover"
                    />
                    <div>
                      <h4 className={`font-semibold ${getFontSizeClassForElement('text-base')} ${
                        effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'
                      }`}>Michael T.</h4>
                      <p className={`text-sm ${getFontSizeClassForElement('text-sm')} ${
                        effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                      }`}>Portland, OR</p>
                    </div>
                  </div>
                  <p className={`italic text-sm sm:text-base ${getFontSizeClassForElement('text-sm')} ${
                    effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>"What I love about Strictly Friendly is that it's genuinely about friendship. I've tried other apps that claim to be for friends but end up being dating apps in disguise. Here, I've found a great group for board game nights!"</p>
                </div>
              </SwiperSlide>
              <SwiperSlide className="w-full">
                <div className={`p-6 sm:p-8 rounded-lg shadow-md ${
                  effectiveTheme === 'dark' ? 'bg-gray-700' : 'bg-white'
                }`}>
                  <div className="flex items-center mb-4">
                    <img
                      src="https://readdy.ai/api/search-image?query=professional%20portrait%20photo%20of%20a%20friendly%20non-binary%20person%20with%20colorful%20hair%2C%20natural%20lighting%2C%20soft%20background%2C%20high%20quality%2C%20photorealistic%2C%208k&width=60&height=60&seq=test3&orientation=squarish"
                      alt="User"
                      className="w-12 h-12 rounded-full mr-4 object-cover"
                    />
                    <div>
                      <h4 className={`font-semibold ${getFontSizeClassForElement('text-base')} ${
                        effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'
                      }`}>Alex R.</h4>
                      <p className={`text-sm ${getFontSizeClassForElement('text-sm')} ${
                        effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                      }`}>Austin, TX</p>
                    </div>
                  </div>
                  <p className={`italic text-sm sm:text-base ${getFontSizeClassForElement('text-sm')} ${
                    effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>"As someone who's introverted, making friends can be challenging. Strictly Friendly's focus on shared interests made it so much easier to start conversations and find people I actually want to spend time with."</p>
                </div>
              </SwiperSlide>
            </Swiper>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="px-4 py-12 sm:py-16 lg:py-20 ">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
            <div className="w-full lg:w-1/2">
            <img
              src="https://readdy.ai/api/search-image?query=diverse%20group%20of%20friends%20enjoying%20coffee%20at%20a%20cafe%2C%20laughing%20and%20talking%2C%20warm%20indoor%20lighting%2C%20soft%20background%2C%20high%20quality%2C%20photorealistic%2C%208k%2C%20friendship%20concept&width=500&height=400&seq=cta1&orientation=landscape"
              alt="Friends at cafe"
                className="rounded-lg shadow-lg w-full h-auto"
            />
          </div>
          <div className="md:w-1/2 md:pl-12">
            <h2 className={`text-3xl font-bold mb-6 ${getFontSizeClassForElement('text-3xl')} ${
              effectiveTheme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>Ready to make meaningful connections?</h2>
            <p className={`mb-8 ${getFontSizeClassForElement('text-base')} ${
              effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>Join thousands of people who are finding authentic friendships through Strictly Friendly. Our platform is designed to help you connect with people who share your interests and values.</p>
            <Link
              to={'/onboarding'}
              className={`bg-${currentColor.primary} hover:bg-${currentColor.hover} text-white font-semibold py-3 px-8 rounded-full shadow-lg transition duration-300 ease-in-out !rounded-button whitespace-nowrap cursor-pointer ${getFontSizeClassForElement('text-base')}`}
            >
                Join Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
