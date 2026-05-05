import React from 'react';
import { Text, View } from 'react-native';

export default function PasswordSyncBadge({ pending }) {
  return (
    <View
      className={`rounded-full px-2.5 py-1 ${
        pending ? 'bg-[#FFF1C7]' : 'bg-[#DFF7E8]'
      }`}
    >
      <Text
        className={`text-[11px] font-bold ${
          pending ? 'text-[#8A5A00]' : 'text-[#116B3B]'
        }`}
      >
        {pending ? 'Pendente' : 'Sincronizada'}
      </Text>
    </View>
  );
}
