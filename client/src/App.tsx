import { Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import Login from './pages/Authentication/Login';
import { Signup } from './pages/Authentication/Signup';
import Home from './pages/Home';
import { ProfilePage } from './pages/Profile';
import { Messages } from './pages/Messages';
import Activity from './pages/Activity';
import { OnboardingForm } from './pages/OnboardingForm';
import { PrivateRoute } from './components/PrivateRoute';
import { Settings } from './pages/Settings';
import { DeviceManagement } from './pages/DeviceManagement';
import Notification from './pages/Contact/Notification';
import { Discover } from './pages/Discover';
import { Friends } from './pages/Friends';
import About from './pages/About';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import ActivityDetails from './pages/Activity/ActivityDetails';
import { FormDataProvider } from './context/FormDataContext';
import { ThemeProvider } from './context/ThemeContext';
import { SignupSuccess } from './pages/Authentication/SignupSuccess';
import { AuthCallback } from './pages/Authentication/AuthCallback';
import { EmailVerification } from './pages/Authentication/EmailVerification';
import ProfileSummary from './pages/ProfileSummary';
import MainLayout from './layouts/MainLayout';
import HomeLayout from './layouts/HomeLayout';
import { GlobalLocationWatcher } from './components/GlobalLocationWatcher';
import { NotificationSubscriber } from './components/NotificationSubscriber';
import { MessageSubscriber } from './components/MessageSubscriber';
import { PresenceSubscriber } from './components/PresenceSubscriber';
import NotificationHandler from './components/NotificationHandler';
import ForgotPassword from './pages/Authentication/Login/ForgotPassword';
import ResetPassword from './pages/Authentication/Login/ResetPassword';
import ResetSuccessful from './pages/Authentication/Login/ResetSuccessful';

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <GlobalLocationWatcher />
        <NotificationSubscriber />
        <MessageSubscriber />
        <PresenceSubscriber />
        <NotificationHandler />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Signup />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signup-success" element={<SignupSuccess />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/verify" element={<EmailVerification />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/reset-successful" element={<ResetSuccessful />} />
          <Route element={<HomeLayout />}><Route path="/" element={<Home />} /></Route>
          <Route element={<MainLayout />}>
            <Route path="/onboarding" element={<PrivateRoute><FormDataProvider><OnboardingForm /></FormDataProvider></PrivateRoute>} />
            <Route path="/profile/:userId" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
            <Route path="/activities" element={<PrivateRoute><Activity /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
            <Route path="/device-management" element={<PrivateRoute><DeviceManagement /></PrivateRoute>} />
            <Route path="/notifications" element={<PrivateRoute><Notification /></PrivateRoute>} />
            <Route path="/discover" element={<PrivateRoute><Discover /></PrivateRoute>} />
            <Route path="/connections" element={<PrivateRoute><Friends /></PrivateRoute>} />
            <Route path="/profile-summary" element={
              <PrivateRoute>
                <ProfileSummary />
              </PrivateRoute>
            } />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/activities/:id" element={<ActivityDetails />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
