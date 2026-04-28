import React from 'react';
import { Text, View } from 'react-native';

export default function Toast({ message }) {
  if (!message) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 20,
        right: 20,
        bottom: 36,
        zIndex: 1000,
      }}
    >
      <View className="items-center justify-center rounded-xl bg-[#4169E1] px-3.5 py-2.5">
        <Text className="text-sm text-white">{message}</Text>
      </View>
    </View>
  );
}
