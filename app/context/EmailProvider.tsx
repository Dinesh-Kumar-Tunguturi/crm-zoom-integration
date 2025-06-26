// app/context/EmailProvider.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

type EmailContextType = {
  signupEmail: string;
  setSignupEmail: (email: string) => void;
};

const EmailContext = createContext<EmailContextType | undefined>(undefined);

export function EmailProvider({ children }: { children: ReactNode }) {
  const [signupEmail, setSignupEmail] = useState('');
  return (
    <EmailContext.Provider value={{ signupEmail, setSignupEmail }}>
      {children}
    </EmailContext.Provider>
  );
}

export function useEmail() {
  const context = useContext(EmailContext);
  if (!context) {
    throw new Error('useEmail must be used within an EmailProvider');
  }
  return context;
}