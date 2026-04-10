import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { CustomButton } from "../components/CustomButton";
import { useAuth } from "../hooks/useAuth";
import { colors, radius, spacing } from "../theme/colors";

export const LoginScreen = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        setError("Invalid user role");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.appName}>employee-tracker</Text>
      <Text style={styles.title}>Sign in</Text>
      <Text style={styles.subtitle}>Track attendance, leaves and work hours</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor={colors.text.placeholder}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          placeholderTextColor={colors.text.placeholder}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <CustomButton
        title="Continue"
        onPress={handleLogin}
        loading={loading}
        style={{ marginTop: spacing.small }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xlarge,
    justifyContent: "center"
  },
  appName: {
    color: colors.accent,
    fontSize: 14,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: spacing.small
  },
  title: {
    color: colors.text.primary,
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: spacing.xsmall
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: 14,
    marginBottom: spacing.xlarge
  },
  field: { marginBottom: spacing.medium },
  label: { color: colors.text.label, fontSize: 13, marginBottom: spacing.xsmall },
  input: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text.primary,
    padding: 14,
    borderRadius: radius.medium,
    fontSize: 15
  },
  errorText: { color: colors.status.error, fontSize: 14, marginBottom: spacing.medium },
});
