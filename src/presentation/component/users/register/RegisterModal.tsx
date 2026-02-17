import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRegister } from '../../../hooks/useRegister';
import { UserService } from '../../../../service/UserService';

type RegisterProps = {
  onRegisterSuccess?: () => void;
  onBackToLogin?: () => void;
};

const Register: React.FC<RegisterProps> = ({ onRegisterSuccess, onBackToLogin }) => {
  const insets = useSafeAreaInsets();
  const { height } = Dimensions.get('window');
  const { isLoading, error, clearError, register } = useRegister();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isValid =
    UserService.isValidEmail(email.trim()) &&
    password.length >= 12 &&
    password === confirmPassword;

  const handleRegister = async () => {
    if (!isValid) return;

    try {
      await register(email, password, fullName || undefined);
      onRegisterSuccess?.();
    } catch {
      // Error is handled by the hook
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.background,
          { minHeight: height, paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.contentContainer}>
          {/* Hero Section */}
          <View style={styles.logoContainer}>
            <View style={styles.heroBox}>
              <Text style={styles.heroText}>SV</Text>
            </View>
            <Text style={styles.title}>SMARTVAULT</Text>
            <Text style={styles.subtitle}>NEW ENROLLMENT</Text>
          </View>

          {/* Registration Form */}
          <View style={styles.card}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>IDENTIFIER</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="EMAIL"
                  placeholderTextColor="#52525B"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    clearError();
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  editable={!isLoading}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>FULL NAME</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="OPTIONAL"
                  placeholderTextColor="#52525B"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  editable={!isLoading}
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
                  onChangeText={(text) => {
                    setPassword(text);
                    clearError();
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Text style={styles.eyeText}>{showPassword ? 'HIDE' : 'SHOW'}</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.hintText}>MIN 12 CHARACTERS</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>CONFIRM ACCESS KEY</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="CONFIRM PASSWORD"
                  placeholderTextColor="#52525B"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    clearError();
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <Text style={styles.eyeText}>{showConfirmPassword ? 'HIDE' : 'SHOW'}</Text>
                </TouchableOpacity>
              </View>
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <Text style={styles.validationError}>PASSWORDS DO NOT MATCH</Text>
              )}
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleRegister}
              disabled={isLoading || !isValid}
              style={[styles.button, (isLoading || !isValid) && styles.buttonDisabled]}
            >
              {isLoading ? (
                <ActivityIndicator color="black" />
              ) : (
                <Text style={styles.buttonText}>CREATE ACCOUNT</Text>
              )}
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={styles.mutedText}>ALREADY ENROLLED? </Text>
              <TouchableOpacity onPress={() => onBackToLogin?.()}>
                <Text style={styles.linkTextBold}>AUTHENTICATE</Text>
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
  hintText: {
    color: '#71717A',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 8,
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
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#FFFFFF',
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
  linkTextBold: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textDecorationLine: 'underline',
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
  validationError: {
    color: '#F87171',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 8,
    marginLeft: 4,
  },
});

export default Register;
