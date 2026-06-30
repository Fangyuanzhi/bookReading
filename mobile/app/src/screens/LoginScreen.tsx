import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuthStore } from '../store/auth';
import { theme } from '../theme';

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');

  const { login, register, isLoading } = useAuthStore();

  const handleSubmit = async () => {
    setError('');
    try {
      if (isLogin) {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, displayName.trim() || undefined);
      }
    } catch (err) {
      setError((err as Error).message || '操作失败，请重试');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.hero}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>📖</Text>
        </View>
        <Text style={styles.brand}>陪读</Text>
        <Text style={styles.tagline}>氛围陪伴式读书，不是一个人在读</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{isLogin ? '欢迎回来' : '加入陪读'}</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>邮箱</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="your@email.com"
          placeholderTextColor={theme.faint}
        />

        <Text style={styles.label}>密码</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder={isLogin ? '输入密码' : '至少 8 位'}
          placeholderTextColor={theme.faint}
        />

        {!isLogin ? (
          <>
            <Text style={styles.label}>昵称（可选）</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="怎么称呼你"
              placeholderTextColor={theme.faint}
            />
          </>
        ) : null}

        <Pressable
          style={[styles.btnPrimary, isLoading && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnPrimaryText}>
              {isLogin ? '登录' : '注册并开始阅读'}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => {
            setIsLogin(!isLogin);
            setError('');
          }}
          style={styles.switchRow}
        >
          <Text style={styles.switchHint}>
            {isLogin ? '还没有账号？' : '已有账号？'}
            <Text style={styles.switchAction}>{isLogin ? ' 立即注册' : ' 去登录'}</Text>
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.bg,
    padding: 24,
    justifyContent: 'center',
  },
  hero: { alignItems: 'center', marginBottom: 32 },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(37,99,235,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: { fontSize: 28 },
  brand: { fontSize: 32, fontWeight: '700', color: theme.text, marginBottom: 8 },
  tagline: { fontSize: 14, color: theme.soft, textAlign: 'center' },
  card: {
    backgroundColor: theme.bgPanel,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 24,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorBox: {
    backgroundColor: theme.dangerBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { color: theme.danger, fontSize: 14 },
  label: { fontSize: 12, color: theme.soft, marginBottom: 8, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.text,
    backgroundColor: theme.bgPanel,
    marginBottom: 8,
  },
  btnPrimary: {
    backgroundColor: theme.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  btnDisabled: { opacity: 0.6 },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  switchRow: { marginTop: 20, alignItems: 'center' },
  switchHint: { fontSize: 14, color: theme.soft },
  switchAction: { color: theme.primary, fontWeight: '500' },
});
