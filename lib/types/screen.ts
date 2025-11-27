import { Profile, UserRole } from '../types';

export interface ScreenProps {
  currentUser?: Profile | null;
  navigate: (path: string) => void;
}

export interface LoginProps {
  onLogin: (role: UserRole, mode: 'login' | 'register', email: string, password: string, name?: string) => void;
}

export interface ChatDetailProps extends ScreenProps {
  currentUser: Profile;
  roomId: string;
}

export interface ProfileProps extends ScreenProps {
  currentUser: Profile;
  onLogout: () => void;
}

export interface PublicProfileProps extends ScreenProps {
    currentUser: Profile | null;
    targetUserId: string;
}

export interface GroupManageProps extends ScreenProps {
    roomId?: string;
}
