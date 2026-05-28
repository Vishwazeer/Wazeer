import { create } from "zustand";
import type { User } from "firebase/auth";

interface AuthState {
  user: User | null;
  authLoading: boolean;
  authModalOpen: boolean;
  
  setUser: (user: User | null) => void;
  setAuthLoading: (loading: boolean) => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;

  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string, isSignUp: boolean) => Promise<void>;
  signInWithPhone: (phone: string, recaptchaVerifier: any) => Promise<any>;
  confirmPhoneCode: (confirmationResult: any, code: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  authLoading: true,
  authModalOpen: false,

  setUser: (user) => set({ user }),
  setAuthLoading: (loading) => set({ authLoading: loading }),
  openAuthModal: () => set({ authModalOpen: true }),
  closeAuthModal: () => set({ authModalOpen: false }),

  signInWithGoogle: async () => {
    const { signInWithPopup } = await import("firebase/auth");
    const { auth, googleProvider } = await import("@/lib/firebase");
    const result = await signInWithPopup(auth, googleProvider);
    set({ user: result.user, authModalOpen: false });
  },

  signInWithEmail: async (email, password, isSignUp) => {
    const { auth } = await import("@/lib/firebase");
    if (isSignUp) {
      const { createUserWithEmailAndPassword } = await import("firebase/auth");
      const result = await createUserWithEmailAndPassword(auth, email, password);
      set({ user: result.user, authModalOpen: false });
    } else {
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      const result = await signInWithEmailAndPassword(auth, email, password);
      set({ user: result.user, authModalOpen: false });
    }
  },

  signInWithPhone: async (phone, recaptchaVerifier) => {
    const { auth } = await import("@/lib/firebase");
    const { signInWithPhoneNumber } = await import("firebase/auth");
    const confirmationResult = await signInWithPhoneNumber(auth, phone, recaptchaVerifier);
    return confirmationResult;
  },

  confirmPhoneCode: async (confirmationResult, code) => {
    const result = await confirmationResult.confirm(code);
    set({ user: result.user, authModalOpen: false });
  },

  signOut: async () => {
    const { auth } = await import("@/lib/firebase");
    const { signOut: firebaseSignOut } = await import("firebase/auth");
    await firebaseSignOut(auth);
    set({ user: null });
  },
}));
