import React, { useState } from 'react';
import { View } from 'react-native';
import Login from '../component/users/login/Login';
import Register from '../component/users/register/RegisterModal';
import { useAuthContext } from '../context/AuthContext';

const LoginScreen = () => {
  const { updateAuthState } = useAuthContext();
  const [showRegister, setShowRegister] = useState(false);

  const handleLoginSuccess = () => {
    console.log('LoginScreen - Login successful, updating auth state');
    updateAuthState();
  };

  return (
    <View className="flex-1 bg-black">
      {showRegister ? (
        <Register
          onRegisterSuccess={() => setShowRegister(false)}
          onBackToLogin={() => setShowRegister(false)}
        />
      ) : (
        <Login
          onLoginSuccess={handleLoginSuccess}
          onShowRegister={() => setShowRegister(true)}
        />
      )}
    </View>
  );
};

export default LoginScreen;
