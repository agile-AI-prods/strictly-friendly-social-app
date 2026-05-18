import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { useEffect } from 'react';
import { message } from 'antd';
import { useTheme } from '../context/ThemeContext';

const HomeLayout = () => {
  const [messageApi, messageContextHolder] = message.useMessage();
  const { effectiveTheme, getFontSizeClassForElement } = useTheme();

  const handleNotification = (event: CustomEvent) => {
    messageApi.open({
      type: 'success',
      content: event.detail.content,
      duration: 5,
    });
  };
  useEffect(() => {
    window.addEventListener('notification:new', handleNotification as EventListener);
    return () => {
      window.removeEventListener('notification:new', handleNotification as EventListener);
    };
  }, []);

  return (
    <div className={`flex flex-col ${effectiveTheme === 'dark' ? 'bg-gray-950' : 'bg-white'}`}>
      {messageContextHolder}
      <Navbar />
      <div className={` flex flex-grow  ${effectiveTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
        }`}>
        <main className={`w-full flex-grow ${getFontSizeClassForElement('text-base')} ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default HomeLayout;
