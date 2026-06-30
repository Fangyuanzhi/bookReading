import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import DiscoverScreen from '../screens/DiscoverScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ShelfScreen from '../screens/ShelfScreen';
import { theme } from '../theme';
import type { MainTabParamList } from './params';

const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.45 }}>{label}</Text>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.bgPanel },
        headerTitleStyle: { fontWeight: '600', color: theme.text },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.faint,
        tabBarStyle: { borderTopColor: theme.line },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: '书库',
          tabBarLabel: '书库',
          tabBarIcon: ({ focused }) => <TabIcon label="📚" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Shelf"
        component={ShelfScreen}
        options={{
          title: '书架',
          tabBarLabel: '书架',
          tabBarIcon: ({ focused }) => <TabIcon label="📖" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          title: '发现',
          tabBarLabel: '发现',
          tabBarIcon: ({ focused }) => <TabIcon label="✨" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: '我的',
          tabBarLabel: '我的',
          tabBarIcon: ({ focused }) => <TabIcon label="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}
