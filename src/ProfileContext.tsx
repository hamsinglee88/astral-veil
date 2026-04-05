import { createContext, useContext, type ReactNode } from 'react';
import type { UserProfile } from './lib/userProfile';

const ProfileContext = createContext<UserProfile | null>(null);

export function ProfileProvider({
  value,
  children,
}: {
  value: UserProfile | null;
  children: ReactNode;
}) {
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): UserProfile | null {
  return useContext(ProfileContext);
}
