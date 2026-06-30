import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/auth';
import { theme } from '../theme';
import BookDetailScreen from '../screens/BookDetailScreen';
import FollowListScreen from '../screens/FollowListScreen';
import LoginScreen from '../screens/LoginScreen';
import MyNotesScreen from '../screens/MyNotesScreen';
import MyReviewsScreen from '../screens/MyReviewsScreen';
import ReaderScreen from '../screens/ReaderScreen';
import SettingsScreen from '../screens/SettingsScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import MainTabs from './MainTabs';
import type { RootStackParamList } from './params';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const token = useAuthStore((s) => s.token);

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.bgPanel },
        headerTintColor: theme.primary,
        headerTitleStyle: { fontWeight: '600', color: theme.text },
        contentStyle: { backgroundColor: theme.bg },
      }}
    >
      {token ? (
        <>
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="BookDetail"
            component={BookDetailScreen}
            options={{ title: '书籍详情' }}
          />
          <Stack.Screen
            name="Reader"
            component={ReaderScreen}
            options={{ headerShown: false, animation: 'fade' }}
          />
          <Stack.Screen
            name="UserProfile"
            component={UserProfileScreen}
            options={{ title: '个人主页' }}
          />
          <Stack.Screen
            name="FollowList"
            component={FollowListScreen}
            options={{ title: '关注列表' }}
          />
          <Stack.Screen
            name="MyNotes"
            component={MyNotesScreen}
            options={{ title: '我的段评' }}
          />
          <Stack.Screen
            name="MyReviews"
            component={MyReviewsScreen}
            options={{ title: '我的书评' }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: '设置' }}
          />
        </>
      ) : (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
}
