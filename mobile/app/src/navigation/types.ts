import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from './params';

export type RootStackProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;
