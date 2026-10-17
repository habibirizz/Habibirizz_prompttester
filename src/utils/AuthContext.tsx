import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the shape of user data
interface UserData {
  token: string;
  name?: string;
  email?: string;
  picture?: string;
  [key: string]: any; // For additional fields from Google response
}

// Define the shape of the Auth context
interface AuthContextType {
  userData: UserData | null;
  isAuthenticated: boolean;
  login: (responseData: UserData) => void;
  logout: () => void;
   updateUserData: (updates: Partial<UserData>) => void;
}

// Create the Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUserData = localStorage.getItem('userData');
    
    if (token && storedUserData) {
      setUserData(JSON.parse(storedUserData) as UserData);
      setIsAuthenticated(true);
    }
  }, []);

  // Function to handle login and store user data
  const login = (responseData: UserData) => {
    setUserData(responseData);
    setIsAuthenticated(true);
    localStorage.setItem('userData', JSON.stringify(responseData));
    localStorage.setItem('token', responseData.token);
  };

const updateUserData = (updates: Partial<UserData>) => {
  setUserData((prev) => {
    if (!prev) return prev; // No user data to update
    const updated = { ...prev, ...updates }; // ✅ Merge old + new
    localStorage.setItem("userData", JSON.stringify(updated)); // ✅ Persist merged data
    console.log(updated,"updated")
    return updated;
  });
};


  // Function to handle logout
  const logout = () => {
    setUserData(null);
    setIsAuthenticated(false);
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ userData, isAuthenticated, login, logout,updateUserData  }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the Auth Context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};