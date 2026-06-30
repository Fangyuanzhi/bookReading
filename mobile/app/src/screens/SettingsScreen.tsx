import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { clearExpiredCache, clearAllCache } from '../store/offlineCache';
import { useAuthStore } from '../store/auth';
import { theme } from '../theme';
import type { RootStackParamList } from '../navigation/params';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function MenuItem({
  icon,
  label,
  onPress,
  danger,
  value,
}: {
  icon: string;
  label: string;
  onPress?: () => void;
  danger?: boolean;
  value?: string | React.ReactNode;
}) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress} disabled={!onPress}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={[styles.menuLabel, danger && { color: theme.danger }]}>{label}</Text>
      {typeof value === 'string' ? (
        <Text style={styles.menuValue}>{value}</Text>
      ) : (
        value
      )}
      {onPress ? <Text style={styles.menuArrow}>›</Text> : null}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const logout = useAuthStore((s) => s.logout);
  const [readerThemeAuto, setReaderThemeAuto] = useState(false);

  const handleClearCache = () => {
    Alert.alert('清除缓存', '确定要清除所有离线缓存吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        style: 'destructive',
        onPress: async () => {
          await clearAllCache();
          Alert.alert('已清除', '离线缓存已清空');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.root}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>阅读</Text>
        <MenuItem
          icon="🌙"
          label="跟随系统主题"
          value={
            <Switch
              value={readerThemeAuto}
              onValueChange={setReaderThemeAuto}
              thumbColor={readerThemeAuto ? theme.primary : '#f4f3f4'}
              trackColor={{ false: theme.line, true: theme.primaryLight }}
            />
          }
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>存储</Text>
        <MenuItem
          icon="🗑️"
          label="清除离线缓存"
          onPress={handleClearCache}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>账号</Text>
        <MenuItem
          icon="🚪"
          label="退出登录"
          danger
          onPress={logout}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>关于</Text>
        <MenuItem icon="📱" label="陪读 RN" value="M4b" />
        <MenuItem icon="🔖" label="版本" value="1.0.0" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.soft,
    marginBottom: 10,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bgPanel,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.line,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
  },
  menuIcon: { fontSize: 18, marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 16, color: theme.text },
  menuValue: { fontSize: 14, color: theme.soft, marginRight: 8 },
  menuArrow: { fontSize: 20, color: theme.faint },
});
