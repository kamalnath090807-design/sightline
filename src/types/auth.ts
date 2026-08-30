export interface UserProfile {
  id: string;
  name: string;
  displayName?: string;
  email: string;
  emailVerified: boolean;
  createdAt?: string;
  preferences?: {
    theme: 'light' | 'dark';
    textSize: 'normal' | 'large' | 'xl';
    highContrast: boolean;
    voiceEnabled: boolean;
  };
}

export interface SignupPayload {
  name: string;
  displayName?: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
  requiresVerification?: boolean;
  demoVerificationUrl?: string;
  data?: any;
}
