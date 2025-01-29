import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";

// Importing screens directly
import AnimeScreen from "../screens/AnimeScreen";
import CharacterScreen from "../screens/CharacterScreen";
import SearchScreen from "../screens/SearchScreen";
import VoiceActorScreen from "../screens/VoiceActorScreen";
import SeeAllScreen from "../screens/SeeAllScreen";
import AIChatScreen from "../screens/AIChatScreen";
import SeasonsScreen from "../screens/SeasonsScreen";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import PreferenceScreen from "../screens/PreferenceScreen";
import LoggedHomeScreen from "../screens/LoggedHomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import CommentsScreen from "../screens/CommentsScreen";
import RepliesScreen from "../screens/RepliesScreen";
import TopCharacters from "../screens/TopCharacters";
import SettingsScreen from "../screens/SettingsScreen";
import OthersProfileScreen from "../screens/OthersProfileScreen";
import StreamScreen from "../screens/StreamScreen";
import ForgotPasswordScreen from "../screens/ForgetPassword";
import LastUpdated from "../screens/LastUpdates";
import LastWatch from "../screens/LastWatch";
import TopRate from "../screens/TopRate";
import CustomListScreen from "../screens/CustomListScreen";
import ResetPasswordScreen from "../screens/ResetPasswordScreen";
import VerificationScreen from "../screens/VerificationScreen";
import CoinsScreen from "../screens/CoinsScreen";
import AirDates from "../screens/AirDates";

const Stack = createNativeStackNavigator();

// Fallback component (still retained if needed)
const Loading = () => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <ActivityIndicator size="large" color="#5abf75" />
  </View>
);

export default function AppNavigation() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="LoggedHome" options={{ headerShown: false }} component={LoggedHomeScreen} />
      <Stack.Screen name="Anime" options={{ headerShown: false }} component={AnimeScreen} />
      <Stack.Screen name="AddCoins" options={{ headerShown: false }} component={CoinsScreen} />
      <Stack.Screen name="Character" options={{ headerShown: false }} component={CharacterScreen} />
      <Stack.Screen name="Search" options={{ headerShown: false }} component={SearchScreen} />
      <Stack.Screen name="VoiceActor" options={{ headerShown: false }} component={VoiceActorScreen} />
      <Stack.Screen name="SeeAll" options={{ headerShown: false }} component={SeeAllScreen} />
      <Stack.Screen name="AIChat" options={{ headerShown: false }} component={AIChatScreen} />
      <Stack.Screen name="Seasons" options={{ headerShown: false }} component={SeasonsScreen} />
      <Stack.Screen name="Login" options={{ headerShown: false }} component={LoginScreen} />
      <Stack.Screen name="Signup" options={{ headerShown: false }} component={SignupScreen} />
      <Stack.Screen name="Preference" options={{ headerShown: false }} component={PreferenceScreen} />
      <Stack.Screen name="Profile" options={{ headerShown: false }} component={ProfileScreen} />
      <Stack.Screen name="EditProfile" options={{ headerShown: false }} component={EditProfileScreen} />
      <Stack.Screen name="comments" options={{ headerShown: false }} component={CommentsScreen} />
      <Stack.Screen name="Replies" options={{ headerShown: false }} component={RepliesScreen} />
      <Stack.Screen name="TopCharacters" options={{ headerShown: false }} component={TopCharacters} />
      <Stack.Screen name="Settings" options={{ headerShown: false }} component={SettingsScreen} />
      <Stack.Screen name="OthersProfile" options={{ headerShown: false }} component={OthersProfileScreen} />
      <Stack.Screen name="Stream" options={{ headerShown: false }} component={StreamScreen} />
      <Stack.Screen name="ForgotPassword" options={{ headerShown: false }} component={ForgotPasswordScreen} />
      <Stack.Screen name="LastUpdates" options={{ headerShown: false }} component={LastUpdated} />
      <Stack.Screen name="LastWatch" options={{ headerShown: false }} component={LastWatch} />
      <Stack.Screen name="GlobalRate" options={{ headerShown: false }} component={TopRate} />
      <Stack.Screen name="CustomList" options={{ headerShown: false }} component={CustomListScreen} />
      <Stack.Screen name="Verification" options={{ headerShown: false }} component={VerificationScreen} />
      <Stack.Screen name="ResetPassword" options={{ headerShown: false }} component={ResetPasswordScreen} />
      <Stack.Screen name="AirDates" options={{ headerShown: false }} component={AirDates} />
    </Stack.Navigator>
  );
}
