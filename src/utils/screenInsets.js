import { Platform, StatusBar } from 'react-native';

export const androidTopInset = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
