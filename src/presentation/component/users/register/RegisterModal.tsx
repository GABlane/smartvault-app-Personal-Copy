import React, { useEffect, useState } from 'react';
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

type RegisterProps = {
  onRegisterSuccess?: () => void;
  onBackToLogin?: () => void;
};

const Register: React.FC<RegisterProps> = ({ onRegisterSuccess, onBackToLogin }) => {
  const insets = useSafeAreaInsets();
  const { height } = Dimensions.get('window');
  const {
    step,
    isLoading,
    error,
    email,
    clearError,
    requestOtp,
    verifyOtp,
    signup,
    resendOtp,
    goBack,
  } = useRegister();

  const [emailInput, setEmailInput] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isEmailValid = emailInput.trim().includes('@') && emailInput.trim().includes('.');
  const isOtpValid = otp.trim().length === 6;
  const isPasswordValid = password.length >= 12 && password === confirmPassword;
  const displayEmail = email || emailInput.trim();

  useEffect(() => {
    if (step === 'email' && email) {
      setEmailInput(email);
    }
    if (step === 'otp') {
      setOtp('');
    }
    if (step === 'details') {
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [step, email]);

  const handleRequestOtp = async () => {
    if (!isEmailValid) return;

    try {
      await requestOtp(emailInput);
    } catch {
      // Error handled by hook
    }
  };

  const handleVerifyOtp = async () => {
    if (!isOtpValid) return;

    try {
      await verifyOtp(otp);
    } catch {
      // Error handled by hook
    }
  };

  const handleSignup = async () => {
    if (!isPasswordValid) return;

    try {
      await signup(password, fullName || undefined);
      onRegisterSuccess?.();
    } catch {
      // Error handled by hook
    }
  };

  const subtitle =
    step === 'email' ? 'NEW ENROLLMENT' : step === 'otp' ? 'VERIFY IDENTITY' : 'COMPLETE ENROLLMENT';

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
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          {/* Registration Form */}
          <View style={styles.card}>
            {step === 'email' && (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>IDENTIFIER</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="EMAIL"
                      placeholderTextColor="#52525B"
                      value={emailInput}
                      onChangeText={(text) => {
                        setEmailInput(text);
                        clearError();
                      }}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoComplete="email"
                      editable={!isLoading}
                    />
                  </View>
                </View>

                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <TouchableOpacity
                  onPress={handleRequestOtp}
                  disabled={isLoading || !isEmailValid}
                  style={[styles.button, (isLoading || !isEmailValid) && styles.buttonDisabled]}
                >
                  {isLoading ? (
                    <ActivityIndicator color="black" />
                  ) : (
                    <Text style={styles.buttonText}>SEND VERIFICATION CODE</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.signupContainer}>
                  <Text style={styles.mutedText}>ALREADY ENROLLED? </Text>
                  <TouchableOpacity onPress={() => onBackToLogin?.()}>
                    <Text style={styles.linkTextBold}>AUTHENTICATE</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {step === 'otp' && (
              <>
                <View style={styles.subtitleEmailContainer}>
                  <Text style={styles.subtitleEmailText}>{displayEmail}</Text>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>VERIFICATION CODE</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={[styles.input, styles.otpInput]}
                      placeholder="______"
                      placeholderTextColor="#52525B"
                      value={otp}
                      onChangeText={(text) => {
                        const sanitized = text.replace(/[^0-9]/g, '');
                        setOtp(sanitized);
                        clearError();
                      }}
                      keyboardType="numeric"
                      maxLength={6}
                      textAlign="center"
                      editable={!isLoading}
                    />
                  </View>
                </View>

                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <TouchableOpacity
                  onPress={handleVerifyOtp}
                  disabled={isLoading || !isOtpValid}
                  style={[styles.button, (isLoading || !isOtpValid) && styles.buttonDisabled]}
                >
                  {isLoading ? (
                    <ActivityIndicator color="black" />
                  ) : (
                    <Text style={styles.buttonText}>VERIFY CODE</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => resendOtp()}
                  disabled={isLoading}
                  style={styles.secondaryLink}
                >
                  <Text style={styles.linkTextBold}>RESEND CODE</Text>
                </TouchableOpacity>

                <View style={styles.bottomLinkContainer}>
                  <TouchableOpacity onPress={() => goBack()} disabled={isLoading}>
                    <Text style={styles.linkTextBold}>BACK</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {step === 'details' && (
              <>
                <View style={styles.subtitleEmailContainer}>
                  <Text style={styles.subtitleEmailText}>{displayEmail}</Text>
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
                      disabled={isLoading}
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
                      disabled={isLoading}
                    >
                      <Text style={styles.eyeText}>
                        {showConfirmPassword ? 'HIDE' : 'SHOW'}
                      </Text>
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
                  onPress={handleSignup}
                  disabled={isLoading || !isPasswordValid}
                  style={[styles.button, (isLoading || !isPasswordValid) && styles.buttonDisabled]}
                >
                  {isLoading ? (
                    <ActivityIndicator color="black" />
                  ) : (
                    <Text style={styles.buttonText}>CREATE ACCOUNT</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.bottomLinkContainer}>
                  <TouchableOpacity onPress={() => goBack()} disabled={isLoading}>
                    <Text style={styles.linkTextBold}>BACK</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
  subtitleEmailContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  subtitleEmailText: {
    color: '#52525B',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
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
  otpInput: {
    fontSize: 24,
    letterSpacing: 8,
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
  secondaryLink: {
    alignItems: 'center',
    marginBottom: 24,
  },
  bottomLinkContainer: {
    alignItems: 'center',
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
