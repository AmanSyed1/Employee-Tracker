import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ConfirmModal } from "../components/ConfirmModal";
import { Header } from "../components/Header";
import { useAuth } from "../hooks/useAuth";
import { useUser } from "../hooks/useUser";
import { colors, radius, shadows, spacing } from "../theme/colors";

type ProfileScreenProps = {
  title?: string;
};

export const ProfileScreen = ({ title = "Profile" }: ProfileScreenProps) => {
  const { user, logout } = useAuth();

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const confirmLogout = () => {
    setLogoutModalVisible(true);
  };

  const handleLogoutConfirm = async () => {
    setLogoutModalVisible(false);
    await AsyncStorage.removeItem("authToken");
    await logout();
    router.replace("/login");
  };

  const { profile, updateProfileImage, loadUser, updateUserProfile } = useUser(user?.uid);

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedPhone, setEditedPhone] = useState("");
  const [editedDepartment, setEditedDepartment] = useState("");
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [departmentModalVisible, setDepartmentModalVisible] = useState(false);

  const departments = ["Marketing", "Back Office", "Venue", "Technical"];

  const enterEditMode = () => {
    setEditedName(profile?.name || "");
    setEditedPhone(profile?.phone || "");
    setEditedDepartment(profile?.department || "");
    setNameError("");
    setPhoneError("");
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSaveProfile = () => {
    setNameError("");
    setPhoneError("");

    let hasError = false;
    if (!editedName.trim()) {
      setNameError("Name cannot be empty");
      hasError = true;
    }

    if (!editedPhone.trim()) {
      setPhoneError("Phone number is required");
      hasError = true;
    } else if (!/^\d{10}$/.test(editedPhone.trim())) {
      setPhoneError("Enter valid 10-digit phone number");
      hasError = true;
    }

    if (hasError) return;

    updateUserProfile({
      name: editedName.trim(),
      phone: editedPhone.trim(),
      department: editedDepartment.trim(),
    });
    setIsEditing(false);
  };

  // Reload profile each time screen gains focus
  useFocusEffect(
    useCallback(() => {
      if (user?.uid) {
        loadUser();
      }
    }, [user?.uid, loadUser])
  );

  // Pick and save profile image
  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Denied", "Permission required to access gallery");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const uri = result.assets[0].uri;
        // updateProfileImage saves to AsyncStorage AND updates state immediately —
        // no need to call loadUser() again
        await updateProfileImage(uri);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  return (
    <View style={styles.container}>
      <ConfirmModal
        visible={logoutModalVisible}
        title="Confirm Logout"
        message="Are you sure you want to logout?"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setLogoutModalVisible(false)}
      />
      
      {/* Global Header */}
      <Header
        title={title}
        onLogout={confirmLogout}
        profileImage={profile?.profileImage}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card — pinned to top below header */}
        <View style={styles.card}>
          {/* Avatar */}
          <TouchableOpacity onPress={pickImage} activeOpacity={0.8} style={styles.avatarWrapper}>
            {profile?.profileImage ? (
              <Image source={{ uri: profile.profileImage }} style={styles.image} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={48} color={colors.text.secondary} />
              </View>
            )}
            {/* Edit badge */}
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>

          {isEditing ? (
            <View style={styles.editForm}>
              <TextInput
                style={[styles.input, nameError ? { borderColor: colors.status.error } : null]}
                placeholder="Name"
                placeholderTextColor={colors.text.placeholder}
                value={editedName}
                onChangeText={(text) => { setEditedName(text); setNameError(""); }}
              />
              {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
              
              <TextInput
                style={[styles.input, phoneError ? { borderColor: colors.status.error } : null]}
                placeholder="Phone Number"
                placeholderTextColor={colors.text.placeholder}
                value={editedPhone}
                onChangeText={(text) => { setEditedPhone(text); setPhoneError(""); }}
                keyboardType="phone-pad"
              />
              {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}

              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setDepartmentModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={{ color: editedDepartment ? colors.text.primary : colors.text.placeholder }}>
                  {editedDepartment || "Select Department"}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
              </TouchableOpacity>

              <Modal visible={departmentModalVisible} transparent animationType="slide" onRequestClose={() => setDepartmentModalVisible(false)}>
                <View style={styles.modalOverlay}>
                  <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setDepartmentModalVisible(false)} />
                  <View style={styles.bottomSheet}>
                    <Text style={styles.sheetTitle}>Select Department</Text>
                    {departments.map((dep) => (
                      <TouchableOpacity
                        key={dep}
                        style={[styles.sheetOption, editedDepartment === dep && styles.sheetOptionSelected]}
                        onPress={() => { setEditedDepartment(dep); setDepartmentModalVisible(false); }}
                      >
                        <Text style={[styles.sheetOptionText, editedDepartment === dep && styles.sheetOptionTextSelected]}>
                          {dep}
                        </Text>
                        {editedDepartment === dep && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </Modal>

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
                  <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              {/* Name */}
              <Text style={styles.name}>{profile?.name || "Employee"}</Text>

              {/* Role badge */}
              {profile?.role && (
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>
                    {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                  </Text>
                </View>
              )}

              {/* Email */}
              <Text style={styles.email}>{user?.email || "No email"}</Text>

              {/* Phone & Department */}
              {(profile?.phone || profile?.department) && (
                <View style={styles.detailsContainer}>
                  {profile.phone && (
                    <Text style={styles.detailText}>
                      <Ionicons name="call" size={14} color={colors.text.secondary} /> {profile.phone}
                    </Text>
                  )}
                  {profile.department && (
                    <Text style={styles.detailText}>
                      <Ionicons name="business" size={14} color={colors.text.secondary} /> {profile.department}
                    </Text>
                  )}
                </View>
              )}

              <TouchableOpacity style={styles.editProfileBtn} onPress={enterEditMode}>
                <Ionicons name="create-outline" size={18} color={colors.primary} />
                <Text style={styles.editProfileText}>Edit Profile</Text>
              </TouchableOpacity>

              {/* Hint */}
              <Text style={styles.editHint}>Tap image to change profile picture</Text>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.large,
    paddingBottom: 60,
  },
  card: {
    width: "100%",
    alignItems: "center",
    backgroundColor: colors.cardBackground,
    padding: spacing.xlarge,
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: spacing.medium,
  },
  image: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.cardBackground,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  editBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.background,
  },
  name: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 6,
  },
  roleBadge: {
    backgroundColor: "rgba(29, 185, 84, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(29, 185, 84, 0.3)",
    marginBottom: 8,
  },
  roleText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  email: {
    color: colors.text.secondary,
    fontSize: 14,
    marginBottom: spacing.medium,
  },
  detailsContainer: {
    alignItems: "center",
    marginBottom: spacing.large,
    gap: 4,
  },
  detailText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radius.large,
    backgroundColor: "rgba(29, 185, 84, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(29, 185, 84, 0.3)",
    marginBottom: spacing.large,
  },
  editProfileText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "bold",
  },
  editHint: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  editForm: {
    width: "100%",
    marginTop: spacing.medium,
  },
  errorText: {
    color: colors.status.error,
    fontSize: 12,
    marginTop: -spacing.small,
    marginBottom: spacing.medium,
    alignSelf: "flex-start",
    marginLeft: 4,
  },
  dropdownButton: {
    backgroundColor: colors.secondaryBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.medium,
    padding: 14,
    marginBottom: spacing.medium,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  bottomSheet: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: radius.large,
    borderTopRightRadius: radius.large,
    padding: spacing.xlarge,
    paddingBottom: 40,
  },
  sheetTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: spacing.large,
  },
  sheetOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetOptionSelected: {
    backgroundColor: "rgba(29, 185, 84, 0.1)",
    borderRadius: radius.medium,
    paddingHorizontal: spacing.medium,
    borderBottomWidth: 0,
    marginVertical: 4,
  },
  sheetOptionText: {
    color: colors.text.primary,
    fontSize: 16,
  },
  sheetOptionTextSelected: {
    color: colors.primary,
    fontWeight: "bold",
  },
  input: {
    backgroundColor: colors.secondaryBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.medium,
    padding: 14,
    color: colors.text.primary,
    marginBottom: spacing.medium,
    width: "100%",
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.medium,
    marginTop: spacing.small,
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: radius.medium,
    backgroundColor: colors.secondaryBackground,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  cancelBtnText: {
    color: colors.text.primary,
    fontWeight: "bold",
    fontSize: 14,
  },
  saveBtn: {
    flex: 1,
    padding: 14,
    borderRadius: radius.medium,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});