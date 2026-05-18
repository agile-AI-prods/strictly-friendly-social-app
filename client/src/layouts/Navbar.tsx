import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Check, Menu, Space, Trash2, Users, X, LogOut, Settings, BellRing, User } from 'lucide-react';
import { Alert, Badge, Button, Card, Dropdown, notification } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/slices/authSlice';
import { selectPendingConnections } from '../store/slices/connectionSlice';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { markNotificationAsRead, deleteNotification } from '../store/slices/notificationSlice';
import { UserAvatarWithPresence } from '../components/UserAvatarWithPresence';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { effectiveTheme, currentColor, getFontSizeClassForElement } = useTheme();

  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const pendingConnections = useSelector(selectPendingConnections);
  const { unreadCount } = useSelector((state: RootState) => state.notifications);
  const unreadCounts = useAppSelector(state => state.messages.unreadCounts);
  const unreadMessageCount = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
  const pendingRequestsCount = pendingConnections.length;
  const unreadNotifications = useSelector((state: RootState) =>
    state.notifications.notifications.filter(n => !n.read)
  );

  const navLinks = [
    { name: 'Home', path: '/', icon: '🏠' },
    { name: 'Discover', path: '/discover', icon: '🔍' },
    { name: 'Messages', path: '/messages', icon: '💬', badge: unreadMessageCount },
    { name: 'Friends', path: '/connections', icon: '👥', badge: pendingRequestsCount },
    { name: 'Strictly Ups', path: '/activities', icon: '⭐' },
  ];

  const userMenuItems = [
    { name: 'Profile', path: `/profile/${user?.id}`, icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'About', path: '/about', icon: 'ℹ️' },
    { name: 'Contact', path: '/contact', icon: '📧' },
  ];

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);
  const toggleNotifications = () => setIsNotificationOpen(!isNotificationOpen);

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/login');
    }
  };

  const notificationContent = (
    <Card
      className={`w-80 max-h-96 overflow-y-auto shadow-lg border-0 ${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}
      styles={{ body: { padding: 12 } }}
    >
      <div className="space-y-3">
        {unreadNotifications.length > 0 ? (
          unreadNotifications.map((notification: any) => (
            <Alert
              key={notification.id}
              showIcon
              description={notification.content}
              type="info"
              className={`border-0 shadow-sm ${effectiveTheme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}
              action={
                <div className="flex space-x-1">
                  <Button
                    size="small"
                    type="text"
                    icon={<Check className="h-3 w-3" />}
                    onClick={() => dispatch(markNotificationAsRead(notification.id))}
                    className={`${effectiveTheme === 'dark' ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-700'}`}
                  />
                  <Button
                    size="small"
                    type="text"
                    icon={<Trash2 className="h-3 w-3" />}
                    onClick={() => dispatch(deleteNotification(notification.id))}
                    className={`${effectiveTheme === 'dark' ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
                  />
                </div>
              }
            />
          ))
        ) : (
          <div className={`text-center py-8 ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            <Bell className={`h-8 w-8 mx-auto mb-2 ${effectiveTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            <p className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>No new notifications</p>
          </div>
        )}
        <div className={`pt-2 border-t ${effectiveTheme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
          <Button
            type="link"
            className={`w-full font-medium ${effectiveTheme === 'dark' ? 'text-gray-300 hover:text-white' : `text-${currentColor.text}`}`}
            onClick={() => {
              setIsNotificationOpen(false);
              navigate('/notifications');
            }}
          >
            View All Notifications
          </Button>
        </div>
      </div>
    </Card>
  );

  const userMenuContent = (
    <Card
      className={`w-56 shadow-lg border-0 ${effectiveTheme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}
      styles={{ body: { padding: 8 } }}
    >
      <div className="space-y-1">
        {userMenuItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`flex items-center px-3 py-2 rounded-md transition-colors ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark'
              ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
              : 'text-gray-700 hover:bg-gray-50'
              }`}
            onClick={() => setIsUserMenuOpen(false)}
          >
            {typeof item.icon === 'string' ? (
              <span className="mr-3">{item.icon}</span>
            ) : (
              <item.icon className={`h-4 w-4 min-w-4 min-h-4 mr-3 ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`} />
            )}
            {item.name}
          </Link>
        ))}
        <div className={`border-t pt-1 mt-1 ${effectiveTheme === 'dark' ? 'border-gray-700' : 'border-gray-100'
          }`}>
          <button
            onClick={() => {
              setIsUserMenuOpen(false);
              handleLogout();
            }}
            className={`flex items-center w-full px-3 py-2 rounded-md transition-colors ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark'
              ? 'text-red-400 hover:bg-red-900/20 hover:text-red-300'
              : 'text-red-600 hover:bg-red-50'
              }`}
          >
            <LogOut className="h-4 w-4 mr-3" />
            Logout
          </button>
        </div>
      </div>
    </Card>
  );

  return (
    <header className={`${effectiveTheme === 'dark' ? 'bg-gray-900' : 'bg-white'} shadow-sm sticky top-0 z-40`}>
      <nav className={`${effectiveTheme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center relative h-full">
              <Link to="/" className="font-bold h-full text-purple-900 cursor-pointer text-xl flex items-center">
                {/* <i className="fas fa-user-friends mr-2"></i> */}
                <img src="/assets/logo/StrictlyLogo.png" className='w-auto h-8 object-contain pr-1' />
                <span className="font-bold text-xl">
                  Strictly Friendly
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`group relative px-3 py-2 font-medium transition-colors ${getFontSizeClassForElement('text-sm')} ${location.pathname === link.path
                    ? `text-${currentColor.text}`
                    : effectiveTheme === 'dark'
                      ? 'text-gray-300 hover:text-white'
                      : 'text-gray-700 hover:text-indigo-600'
                    }`}
                >
                  <span className="flex items-center">
                    <span className="mr-1">{link.icon}</span>

                    {link.badge && link.badge > 0 ? (
                      <Badge
                        count={link.badge}
                        size="small"
                        className="ml-1"
                      >
                        {link.name}
                      </Badge>
                    ) : (
                      <span className={`hidden sm:block font-medium ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                        {link.name}
                      </span>
                    )}
                  </span>
                  {/* Underline effect when active */}
                  {location.pathname === link.path && (
                    <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-${currentColor.primary} rounded-full`}></div>
                  )}
                  {/* Hover underline effect */}
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-${currentColor.primary} rounded-full transform scale-x-0 transition-transform duration-200 ${location.pathname === link.path ? 'scale-x-100' : 'group-hover:scale-x-100'
                    }`}></div>
                </Link>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              {isAuthenticated && (
                <Dropdown
                  overlay={notificationContent}
                  trigger={['click']}
                  open={isNotificationOpen}
                  onOpenChange={setIsNotificationOpen}
                  placement="bottomRight"
                >
                  <button className={`relative p-2 rounded-md transition-colors ${effectiveTheme === 'dark'
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                    }`}>
                    {unreadCount > 0 ? (
                      <BellRing className={`h-5 w-5 text-${currentColor.primary}`} />
                    ) : (
                      <Bell className="h-5 w-5" />
                    )}
                    {unreadCount > 0 && (
                      <span className={`absolute -top-1 -right-1 h-4 w-4 text-white rounded-full flex items-center justify-center ${getFontSizeClassForElement('text-xs')} bg-${currentColor.primary}`}>
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </Dropdown>
              )}

              {/* User Menu */}
              {isAuthenticated ? (
                <Dropdown
                  overlay={userMenuContent}
                  trigger={['click']}
                  open={isUserMenuOpen}
                  onOpenChange={setIsUserMenuOpen}
                  placement="bottomRight"
                >
                  <button className={`flex items-center space-x-2 p-1 rounded-md transition-colors ${effectiveTheme === 'dark'
                    ? 'hover:bg-gray-700'
                    : 'hover:bg-gray-50'
                    }`}>
                    <UserAvatarWithPresence
                      userId={user?.id || ''}
                      photoUrl={user?.photo_url}
                      size={32}
                      alt="Profile"
                    />
                  </button>
                </Dropdown>
              ) : (
                <Link
                  to="/login"
                  className={`inline-flex items-center px-4 py-2 border border-transparent font-medium rounded-md text-white transition-colors ${getFontSizeClassForElement('text-sm')} ${effectiveTheme === 'dark'
                    ? `bg-${currentColor.primary} hover:bg-${currentColor.hover}`
                    : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                >
                  Sign in
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={toggleMenu}
                className={`md:hidden inline-flex items-center justify-center p-2 rounded-md transition-colors ${effectiveTheme === 'dark'
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className={`px-2 pt-2 pb-3 space-y-1 shadow-lg border-t ${effectiveTheme === 'dark'
              ? 'bg-gray-900 border-gray-700'
              : 'bg-white border-gray-200'
              }`}>
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center justify-between px-3 py-3 rounded-md font-medium transition-colors ${getFontSizeClassForElement('text-base')} ${location.pathname === link.path
                    ? `text-${currentColor.text} bg-${currentColor.light}`
                    : effectiveTheme === 'dark'
                      ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                      : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                    }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="flex items-center">
                    <span className="mr-3">{link.icon}</span>
                    {link.name}
                  </span>
                  {link.badge && link.badge > 0 && (
                    <Badge
                      count={link.badge}
                      size="small"
                      className="ml-2"
                    />
                  )}
                </Link>
              ))}

              {/* Mobile User Menu Items */}
              {isAuthenticated && (
                <>
                  <div className={`border-t pt-2 mt-2 ${effectiveTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                    {userMenuItems.map((item) => (
                      <Link
                        key={item.name}
                        to={item.path}
                        className={`flex items-center px-3 py-3 rounded-md font-medium transition-colors ${getFontSizeClassForElement('text-base')} ${effectiveTheme === 'dark'
                          ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                          : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                          }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {typeof item.icon === 'string' ? (
                          <span className="mr-3">{item.icon}</span>
                        ) : (
                          <item.icon className="h-5 w-5 mr-3" />
                        )}
                        {item.name}
                      </Link>
                    ))}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleLogout();
                      }}
                      className={`flex items-center w-full px-3 py-3 rounded-md font-medium transition-colors ${getFontSizeClassForElement('text-base')} ${effectiveTheme === 'dark'
                        ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20'
                        : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                        }`}
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
