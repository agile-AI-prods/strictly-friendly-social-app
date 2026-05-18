import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';
import { useEffect, useState } from 'react';
import { message } from 'antd';
import { useTheme } from '../context/ThemeContext';

const MainLayout = () => {
  const [messageApi, messageContextHolder] = message.useMessage();
  const { effectiveTheme, getFontSizeClassForElement } = useTheme();

  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(true);

  const handleNotification = (event: CustomEvent) => {
    console.log('handleNotification is called');
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
    <div className={`min-h-screen mx-auto w-full overflow-x-hidden ${effectiveTheme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      {messageContextHolder}
      <Navbar />
      <div className={`w-full flex bg-gray-100 flex-col md:flex-row ${effectiveTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
        }`}>
        <nav className='w-full md:w-auto'>
          <LeftSidebar />
        </nav>
        <main className={`flex-1 min-w-0 transition-all duration-300 ${rightSidebarCollapsed ? 'md:mr-0' : 'md:mr-0'
          } ${getFontSizeClassForElement('text-base')} ${effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
          <Outlet />
        </main>
        <aside className={`transition-all duration-300 ${rightSidebarCollapsed ? 'w-full md:w-24' : 'w-full md:w-80'
          }`}>
          <RightSidebar onCollapsedChange={setRightSidebarCollapsed} />
        </aside>
      </div>
      <Footer />
    </div>
  );
};

export default MainLayout;
