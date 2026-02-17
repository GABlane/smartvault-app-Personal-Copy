import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Dimensions, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLogin } from '../../../hooks/useLogin';

const Login = ({ onLoginSuccess, onLoginError, onShowRegister }: { onLoginSuccess?: () => void, onLoginError?: (err: string) => void, onShowRegister?: () => void }) => {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading: loading, error } = useLogin();

  const handleLogin = async () => {
    try {
      const success = await login(email, password);
      if (success) {
        onLoginSuccess?.();
      }
    } catch (err: any) {
      onLoginError?.(err.message || 'Login failed');
    }
  };

  const { height } = Dimensions.get('window');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.background, { minHeight: height, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.contentContainer}>
          
          {/* Hero Section */}
          <View style={styles.logoContainer}>
             <View style={styles.heroBox}>
                <Text style={styles.heroText}>SV</Text>
             </View>
             <Text style={styles.title}>SMARTVAULT</Text>
             <Text style={styles.subtitle}>SECURE ACCESS PROTOCOL</Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            
            {/* Input Fields */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>IDENTIFIER</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="EMAIL"
                  placeholderTextColor="#52525B"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>ACCESS KEY</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="PASSWORD"
                  placeholderTextColor="#52525B"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Text style={styles.eyeText}>{showPassword ? 'HIDE' : 'SHOW'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => {}}
            >
              <Text style={styles.linkText}>RECOVER ACCESS</Text>
            </TouchableOpacity>

            {/* Action Button */}
            <TouchableOpacity
                onPress={handleLogin}
                disabled={loading || !email || !password}
                style={[styles.button, (loading || !email || !password) && styles.buttonDisabled]}
            >
                {loading ? (
                <ActivityIndicator color="black" />
                ) : (
                <Text style={styles.buttonText}>AUTHENTICATE</Text>
                )}
            </TouchableOpacity>

            {/* Signup */}
            <View style={styles.signupContainer}>
              <Text style={styles.mutedText}>NO CREDENTIALS? </Text>
              <TouchableOpacity onPress={() => onShowRegister?.()}>
                <Text style={styles.linkTextBold}>ENROLL NOW</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  background: {
    flex: 1,
    backgroundColor: '#000000',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  heroBox: {
    width: 80,
    height: 80,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    marginBottom: 20,
  },
  heroText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000000',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#71717A',
    letterSpacing: 4,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#000000',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 20,
    height: 64,
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  eyeIcon: {
    marginLeft: 12,
  },
  eyeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  forgotPassword: {
    marginBottom: 40,
    alignSelf: 'center',
  },
  linkText: {
    color: '#71717A',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  linkTextBold: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textDecorationLine: 'underline',
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#27272A',
    shadowOpacity: 0,
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mutedText: {
    color: '#71717A',
    fontSize: 11,
    fontWeight: '700',
  },
  errorContainer: {
    backgroundColor: '#2D1215',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#5C2328',
  },
  errorText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default Login;