import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { CustomButton } from "../components/CustomButton";
import { useAuth } from "../hooks/useAuth";
import { colors, radius, spacing } from "../theme/colors";

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

  const handleLogin = async () => {
    setError("");
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password.trim()) {
      return setError("Please fill all required fields");
    }
    if (!isValidEmail(trimmedEmail)) {
      return setError("Please enter a valid email address");
    }

    try {
      setLoading(true);
      const { role } = await login(trimmedEmail, password);

      if (role === "admin") {
        router.replace("/admin-dashboard");
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
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.medium,
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
});
