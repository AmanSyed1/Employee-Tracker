import { Ionicons } from "@expo/vector-icons";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../services/firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Image, Keyboard, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { CustomButton } from "../components/CustomButton";
import { useAuth } from "../hooks/useAuth";
import { colors, radius, spacing, shadows } from "../theme/colors";


export const LoginScreen = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

  const [showFinalFrame, setShowFinalFrame] = useState(false);

  const [rememberMe, setRememberMe] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const hasRedirected = useRef(false);

  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");

  const hasChecked = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFinalFrame(true);
    }, 7000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkLogin = async () => {
      // await AsyncStorage.clear();
      console.log("[Auth] Checking token...");

      const token = await AsyncStorage.getItem("userToken");
      const role = await AsyncStorage.getItem("userRole");

      if (token && role) {
        console.log("[Auth] Redirecting to dashboard...");

        if (role === "admin") {
          router.replace("/(admin)");
        } else {
          router.replace("/(employee)");
        }

        return;
      }

      console.log("[Auth] No token → stay on login");
      setCheckingAuth(false);
    };

    checkLogin();
  }, []);

  if (checkingAuth) return null;

  const handleLogin = async () => {
    setError("");
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password.trim()) {
      return setError("Please fill all required fields");
    }
    if (!isValidEmail(trimmedEmail)) {
      return setError("Please enter a valid email address");
    }

    if (rememberMe) {
      await AsyncStorage.setItem("userToken", trimmedEmail);
    } else {
      await AsyncStorage.removeItem("userToken");
    }

    try {
      setLoading(true);
      const { role } = await login(trimmedEmail, password);

      if (rememberMe) {
        await AsyncStorage.setItem("userToken", trimmedEmail);
        await AsyncStorage.setItem("userRole", role);
        console.log("[Auth] Token saved");
      } else {
        await AsyncStorage.removeItem("userToken");
        await AsyncStorage.removeItem("userRole");
        console.log("[Auth] Token NOT saved");
      }

      if (role === "admin") {
        router.replace("/(admin)");
      } else if (role === "employee") {
        router.replace("/(employee)");
      } else {
        setError("Invalid credentials. Please try again.");
      }
    } catch (err: any) {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setForgotMessage("");
    setForgotError("");
    
    const trimmedEmail = forgotEmail.trim();
    if (!trimmedEmail) {
      setForgotError("Please enter your registered email address.");
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setForgotError("Please enter a valid email address.");
      return;
    }

    try {
      setForgotLoading(true);
      await sendPasswordResetEmail(auth, trimmedEmail);
      setForgotMessage("Password reset link sent successfully.");
      // Optional: auto-clear after 3 seconds or allow user to close
      setTimeout(() => {
        if (showForgotModal) {
          setShowForgotModal(false);
          setForgotEmail("");
          setForgotMessage("");
        }
      }, 3000);
    } catch (err: any) {
      // Handle Firebase specific errors gracefully
      if (err.code === "auth/user-not-found") {
        setForgotError("No account found with this email.");
      } else if (err.code === "auth/invalid-email") {
        setForgotError("Please enter a valid email address.");
      } else {
        setForgotError("Something went wrong. Please try again.");
      }
    } finally {
      setForgotLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <View style={[styles.container, { backgroundColor: "#0D0D0D" }]} />
    );
  }

  return (
    <LinearGradient
      colors={["#0D0D0D", "#0F2A1D"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.keyboardView, { zIndex: 1 }]}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.centeredContainer}>
            {/* 🔥 Animation */}
            <View style={styles.animationContainer} pointerEvents="none">
              <Image
                source={
                  showFinalFrame
                    ? require('../../assets/animations/final_screen (2).png')
                    : require('../../assets/animations/final_animation.gif')
                }
                style={styles.animation}
                resizeMode="contain"
              />
            </View>

            <Animated.View
              entering={FadeInUp.duration(500).delay(200)}
              style={styles.loginCard}
            >
              {/* Branding Section */}
              <View style={styles.header}>
                <Text style={styles.brandText}>ACE ENTERTAINMENTS</Text>
                <Text style={styles.title}>Let's get you checked in,</Text>
                <Text style={styles.subtitle}>Sign in now!</Text>
              </View>

              {/* Email Field */}
              <View style={styles.field}>
                <View style={[
                  styles.inputContainer,
                  emailFocused && styles.inputFocused
                ]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor={colors.text.placeholder}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                </View>
              </View>

              {/* Password Field */}
              <View style={styles.field}>
                <View style={[
                  styles.inputContainer,
                  passwordFocused && styles.inputFocused
                ]}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Password"
                    placeholderTextColor={colors.text.placeholder}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={colors.text.secondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.actionsRow}>
                <View style={styles.rememberContainer}>
                  <TouchableOpacity onPress={() => setRememberMe(!rememberMe)} activeOpacity={0.7}>
                    <Ionicons
                      name={rememberMe ? "checkbox" : "square-outline"}
                      size={20}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                  <Text style={styles.rememberText}>Remember Me</Text>
                </View>

                <TouchableOpacity onPress={() => {
                  setShowForgotModal(true);
                  setForgotMessage("");
                  setForgotError("");
                  setForgotEmail(email); // Pre-fill if they typed something
                }} activeOpacity={0.7}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              <CustomButton
                title="Continue"
                onPress={handleLogin}
                loading={loading}
                style={styles.loginButton}
              />
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal - proper RN Modal renders above all content */}
      <Modal
        visible={showForgotModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowForgotModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowForgotModal(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContentWrapper} pointerEvents="box-none">
          <Animated.View style={styles.modalCard} entering={FadeInUp.duration(280).springify()}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="lock-closed-outline" size={24} color={colors.primary} />
              </View>
              <TouchableOpacity onPress={() => setShowForgotModal(false)} style={styles.modalCloseBtn} activeOpacity={0.7}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalSubtitle}>
              Enter your registered email address to receive a password reset link.
            </Text>

            <View style={[styles.inputContainer, styles.modalInput]}>
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor={colors.text.placeholder}
                value={forgotEmail}
                onChangeText={(text) => {
                  setForgotEmail(text);
                  setForgotError("");
                  setForgotMessage("");
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoFocus
              />
            </View>

            {forgotError ? (
              <View style={styles.modalFeedbackError}>
                <Ionicons name="alert-circle" size={16} color={colors.status.error} style={{ marginRight: 6 }} />
                <Text style={styles.modalErrorText}>{forgotError}</Text>
              </View>
            ) : null}

            {forgotMessage ? (
              <View style={styles.modalFeedbackSuccess}>
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.modalSuccessText}>{forgotMessage}</Text>
              </View>
            ) : null}

            <CustomButton
              title={forgotMessage ? "Link Sent" : "Send Reset Link"}
              onPress={handleForgotPassword}
              loading={forgotLoading}
              style={[styles.loginButton, forgotMessage ? { backgroundColor: colors.background, borderColor: colors.primary, borderWidth: 1 } : null]}
              textStyle={forgotMessage ? { color: colors.primary } : undefined}
              disabled={!!forgotMessage || forgotLoading}
            />
          </Animated.View>
        </View>
      </Modal>

    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center", // 🔥 bring everything to center
    alignItems: "center",
    paddingHorizontal: spacing.medium,
  },
  animationContainer: {
    alignItems: "center",
    marginBottom: 0,
    backgroundColor: "transparent",
  },
  animation: {
    width: 80,
    height: 80,
    backgroundColor: "transparent",
  },
  loginCard: {
    backgroundColor: "rgba(18, 18, 18, 0.95)",
    borderRadius: 20,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    minHeight: 300,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.large,
  },
  brandText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 2,
    opacity: 0.6,
    marginBottom: 4,
  },
  title: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  field: {
    marginBottom: spacing.medium
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30, 30, 30, 0.8)",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.medium,
    height: 52,
  },
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    backgroundColor: "rgba(29, 185, 84, 0.05)",
  },
  input: {
    color: colors.text.primary,
    paddingHorizontal: 14,
    fontSize: 15,
    flex: 1,
    height: "100%",
  },
  eyeIcon: {
    paddingHorizontal: 12,
  },
  errorText: {
    color: colors.status.error,
    fontSize: 13,
    textAlign: "center",
    marginBottom: spacing.medium
  },
  loginButton: {
    marginTop: spacing.small,
    height: 50,
  },
  rememberContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  rememberText: {
    color: colors.text.secondary,
    marginLeft: 8,
    fontSize: 14,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.large,
  },
  forgotText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  
  // Forgot Password Modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  modalContentWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.large,
    pointerEvents: "box-none" as any,
  },
  modalCard: {
    backgroundColor: colors.cardBackground,
    width: "100%",
    maxWidth: 400,
    borderRadius: radius.large,
    padding: spacing.xlarge,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.medium,
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(29, 185, 84, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseBtn: {
    padding: spacing.small,
    marginRight: -spacing.small,
    marginTop: -spacing.small,
  },
  modalTitle: {
    color: colors.text.primary,
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: spacing.small,
  },
  modalSubtitle: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.large,
  },
  modalInput: {
    marginBottom: spacing.medium,
  },
  modalFeedbackError: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    padding: spacing.medium,
    borderRadius: radius.medium,
    marginBottom: spacing.medium,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  modalFeedbackSuccess: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(29, 185, 84, 0.1)",
    padding: spacing.medium,
    borderRadius: radius.medium,
    marginBottom: spacing.medium,
    borderWidth: 1,
    borderColor: "rgba(29, 185, 84, 0.2)",
  },
  modalErrorText: {
    color: colors.status.error,
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  modalSuccessText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
});
