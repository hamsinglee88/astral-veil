import { useState, useEffect } from 'react';
import {
  Header,
  BottomNav,
  Page,
  LoginPage,
  OnboardingPage,
  HoroscopePage,
  TreeHolePage,
  MatchPage,
  ProfilePage,
} from './components';
import { ProfileProvider } from './ProfileContext';
import { clearUserDataOnLogout } from './lib/logoutClear';
import { loadProfile, saveProfile, type UserProfile } from './lib/userProfile';
import { syncUserProfileToServer } from './lib/syncUserProfile';

export default function App() {
  const [page, setPage] = useState<Page>('login');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loginPhone, setLoginPhone] = useState('');

  useEffect(() => {
    const saved = loadProfile();
    if (saved) {
      setProfile(saved);
      setPage('horoscope');
    }
  }, []);

  useEffect(() => {
    if (!profile) return;
    void syncUserProfileToServer(profile);
  }, [profile]);

  const handleLogin = (phone: string) => {
    setLoginPhone(phone);
    setPage('onboarding');
  };

  const handleOnboardingComplete = (p: UserProfile) => {
    const full: UserProfile = {
      ...p,
      joinedAt: p.joinedAt ?? new Date().toISOString(),
    };
    saveProfile(full);
    setProfile(full);
    setPage('horoscope');
  };

  const handleLogout = () => {
    clearUserDataOnLogout();
    setProfile(null);
    setLoginPhone('');
    setPage('login');
  };

  const showChrome = page !== 'login' && page !== 'onboarding';
  const showNav = profile !== null && showChrome;

  const renderPage = () => {
    switch (page) {
      case 'login':
        return <LoginPage onLogin={handleLogin} />;
      case 'onboarding':
        return (
          <OnboardingPage phone={loginPhone} onComplete={handleOnboardingComplete} />
        );
      case 'horoscope':
        return <HoroscopePage />;
      case 'treehole':
        return <TreeHolePage />;
      case 'match':
        return <MatchPage />;
      case 'profile':
        return <ProfilePage onLogout={handleLogout} />;
      default:
        return <HoroscopePage />;
    }
  };

  return (
    <ProfileProvider value={profile}>
      <div className="min-h-screen bg-background selection:bg-primary/30">
        {showChrome && <Header />}

        <main className="pb-20">{renderPage()}</main>

        {showNav && <BottomNav currentPage={page} setPage={setPage} />}

        <div
          className="fixed inset-0 pointer-events-none z-[-1] opacity-30 mix-blend-soft-light bg-[url('/assets/images/stardust.png')]"
          aria-hidden
        />
      </div>
    </ProfileProvider>
  );
}
