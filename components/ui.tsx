import React from 'react';
import { KeyboardTypeOptions, Pressable, ScrollView, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius } from '../constants/theme';
import type { Option } from '../lib/types';

export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={s.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export const H1 = ({ children }: { children: React.ReactNode }) => <Text style={s.h1}>{children}</Text>;
export const H2 = ({ children }: { children: React.ReactNode }) => <Text style={s.h2}>{children}</Text>;
export const Label = ({ children }: { children: React.ReactNode }) => <Text style={s.label}>{children}</Text>;

export function Muted({ children, small, center }: { children: React.ReactNode; small?: boolean; center?: boolean }) {
  return <Text style={[s.muted, small && s.small, center && s.center]}>{children}</Text>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}) {
  const variantStyle = variant === 'primary' ? s.btnPrimary : variant === 'danger' ? s.btnDanger : s.btnSecondary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [s.btn, variantStyle, (pressed || disabled) && s.dim]}
    >
      <Text style={[s.btnText, variant === 'primary' && s.btnTextOnPrimary, variant === 'danger' && s.btnTextDanger]}>
        {title}
      </Text>
    </Pressable>
  );
}

export function Field({
  label,
  hint,
  error,
  keyboardType = 'decimal-pad',
  ...rest
}: {
  label: string;
  hint?: string;
  error?: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: KeyboardTypeOptions;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences';
}) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      {hint ? <Text style={[s.muted, s.small]}>{hint}</Text> : null}
      <TextInput
        style={[s.input, !!error && s.inputError]}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        {...rest}
      />
      {error ? <Text style={s.error}>{error}</Text> : null}
    </View>
  );
}

export function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={s.chips}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            style={[s.chip, active && s.chipActive]}
          >
            <Text style={[s.chipText, active && s.chipTextActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Notice({ text, tone = 'warn' }: { text: string; tone?: 'warn' | 'danger' | 'info' }) {
  const c = tone === 'danger' ? colors.danger : tone === 'info' ? colors.green : colors.warn;
  return (
    <View style={[s.notice, { borderColor: c, backgroundColor: `${c}12` }]}>
      <Text style={[s.noticeText, { color: c }]}>{text}</Text>
    </View>
  );
}

export function Stat({ label, value, unit = 'kcal', color }: { label: string; value: number | string; unit?: string; color?: string }) {
  return (
    <View style={s.stat}>
      <Text style={[s.muted, s.small]}>{label}</Text>
      <Text style={[s.statValue, color ? { color } : null]}>
        {value}
        <Text style={s.statUnit}> {unit}</Text>
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 48, gap: 14 },
  h1: { color: colors.text, fontSize: 26, fontWeight: '800' },
  h2: { color: colors.text, fontSize: 18, fontWeight: '700' },
  label: { color: colors.text, fontSize: 15, fontWeight: '600', marginTop: 4 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  small: { fontSize: 12.5, lineHeight: 18 },
  center: { textAlign: 'center' },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius,
    padding: 16,
    gap: 10,
  },
  field: { gap: 4 },
  input: {
    backgroundColor: colors.input,
    color: colors.text,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 12.5 },
  btn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  btnPrimary: { backgroundColor: colors.lime },
  btnSecondary: { backgroundColor: colors.input, borderWidth: 1, borderColor: colors.cardBorder },
  btnDanger: { backgroundColor: 'rgba(220,38,38,0.08)', borderWidth: 1, borderColor: colors.danger },
  btnText: { color: colors.text, fontSize: 16, fontWeight: '700' },
  btnTextOnPrimary: { color: '#FFFFFF' },
  btnTextDanger: { color: colors.danger },
  dim: { opacity: 0.6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.input,
  },
  chipActive: { backgroundColor: 'rgba(77,124,15,0.10)', borderColor: colors.lime },
  chipText: { color: colors.text, fontSize: 14 },
  chipTextActive: { color: colors.lime, fontWeight: '700' },
  notice: { borderWidth: 1, borderRadius: 12, padding: 12 },
  noticeText: { fontSize: 13.5, lineHeight: 19 },
  stat: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius,
    padding: 14,
    gap: 4,
  },
  statValue: { color: colors.text, fontSize: 22, fontWeight: '800' },
  statUnit: { color: colors.muted, fontSize: 13, fontWeight: '500' },
});
