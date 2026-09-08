import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, type ComponentProps, type ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { DURATION } from '@/lib/motion';
import PressableScale from '@/components/motion/PressableScale';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useOnboarding } from '@/lib/onboarding';

type Mode = 'login' | 'register';

/**
 * Credentials sign-in, against the API's own password login.
 *
 * The API issues a JWT and this screen hands it to the auth store, which sends
 * it as `Authorization: Bearer …` from then on — the mobile path the backend's
 * JwtStrategy falls back to when there's no cookie.
 */
export default function SignIn() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn, register } = useAuth();
  const { dismiss } = useOnboarding();
  const { mode: initialMode } = useLocalSearchParams<{ mode?: string }>();

  const [mode, setMode] = useState<Mode>(
    initialMode === 'register' ? 'register' : 'login',
  );
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [accepted, setAccepted] = useState(false);

  const isRegister = mode === 'register';
  // Registering additionally requires the consent box — the Data Privacy Act
  // wants consent given knowingly, so it starts unticked and gates submission.
  const canSubmit =
    email.trim().length > 0 &&
    password.length > 0 &&
    (!isRegister || (fullName.trim().length > 0 && accepted));

  const submit = async () => {
    if (!canSubmit || busy) return;
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (isRegister) await register(fullName, email, password, accepted);
      else await signIn(email, password);

      // Signing in satisfies the intro's guard on its own; dismissing keeps the
      // session consistent if they later sign out and back in.
      dismiss();
      router.replace('/');
    } catch (err) {
      // The API's own wording ("Invalid credentials") is more use than anything
      // generic we'd substitute here.
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const forgotPassword = async () => {
    if (busy) return;
    setError(null);
    setNotice(null);
    if (!email.trim()) {
      setError('Enter your email above first, then tap this again.');
      return;
    }
    setBusy(true);
    try {
      const res = await api.auth.forgotPassword(email);
      setNotice(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the reset link.');
    } finally {
      setBusy(false);
    }
  };

  const browseAsGuest = () => {
    dismiss();
    router.replace('/');
  };

  const swap = () => {
    setMode(isRegister ? 'login' : 'register');
    setError(null);
    setNotice(null);
  };

  return (
    <View className="flex-1 bg-slate-100">
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 28,
          }}
          contentContainerClassName="px-6"
          keyboardShouldPersistTaps="handled"
        >
          <PressableScale
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={12}
            className="h-10 w-10 items-center justify-center rounded-full"
          >
            <Ionicons name="arrow-back" size={20} color="#006e59" />
          </PressableScale>

          {/* Lockup */}
          <View className="mt-6 items-center">
            <Image
              source={require('@/assets/images/logo-green.png')}
              style={{ width: 72, height: 72 }}
              contentFit="contain"
            />
            <Text className="mt-1 text-4xl font-bold tracking-tight text-ink">
              Rentiv<Text className="font-sans text-brand">o</Text>
            </Text>
          </View>

          <Text className="font-sans mt-8 text-center text-xl text-slate-500">
            {isRegister ? 'Join ' : 'Welcome to '}
            <Text className="font-bold italic text-ink">Rentivo</Text>
            <Text className="font-sans"> !</Text>
          </Text>

          {/* Form card */}
          <Animated.View
            entering={FadeInDown.duration(DURATION.slow)}
            className="mt-7 rounded-3xl bg-white p-5"
            style={{
              shadowColor: '#006e59',
              shadowOpacity: 0.06,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 },
              elevation: 2,
            }}
          >
            <View className="gap-3.5">
              {isRegister && (
                <Field
                  icon="person-outline"
                  placeholder="Full name"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  textContentType="name"
                />
              )}
              <Field
                icon="mail-outline"
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
              />
              <Field
                icon="lock-closed-outline"
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!reveal}
                autoCapitalize="none"
                textContentType={isRegister ? 'newPassword' : 'password'}
                onSubmitEditing={() => void submit()}
                returnKeyType="go"
                trailing={
                  <PressableScale
                    onPress={() => setReveal((v) => !v)}
                    accessibilityRole="button"
                    accessibilityLabel={reveal ? 'Hide password' : 'Show password'}
                    hitSlop={10}
                  >
                    <Ionicons
                      name={reveal ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#64748b"
                    />
                  </PressableScale>
                }
              />
            </View>

            {isRegister && (
              <PressableScale
                onPress={() => setAccepted((v) => !v)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: accepted }}
                accessibilityLabel="Agree to the Terms, Privacy Policy and Form Consent"
                className="mt-4 flex-row items-start gap-3"
              >
                <View
                  className={`mt-0.5 h-5 w-5 items-center justify-center rounded border-2 ${
                    accepted ? 'border-brand bg-brand' : 'border-slate-300'
                  }`}
                >
                  {accepted && <Ionicons name="checkmark" size={14} color="#ffffff" />}
                </View>
                <Text className="font-sans flex-1 text-xs leading-5 text-slate-500">
                  I agree to Rentivo&apos;s{' '}
                  <Text
                    className="font-semibold text-ink underline"
                    onPress={() => router.push('/legal/terms-and-conditions')}
                  >
                    Terms and Conditions
                  </Text>
                  ,{' '}
                  <Text
                    className="font-semibold text-ink underline"
                    onPress={() => router.push('/legal/privacy-policy')}
                  >
                    Privacy Policy
                  </Text>{' '}
                  and{' '}
                  <Text
                    className="font-semibold text-ink underline"
                    onPress={() => router.push('/legal/form-consent')}
                  >
                    Form Consent
                  </Text>
                  .
                </Text>
              </PressableScale>
            )}

            {!isRegister && (
              <PressableScale
                onPress={() => void forgotPassword()}
                accessibilityRole="button"
                hitSlop={8}
                className="mt-3 self-end"
              >
                <Text className="text-sm font-semibold text-ink underline">
                  Forgot your password?
                </Text>
              </PressableScale>
            )}

            {!!error && (
              <Banner tone="error" icon="alert-circle-outline" text={error} />
            )}
            {!!notice && (
              <Banner tone="notice" icon="mail-outline" text={notice} />
            )}

            <PressableScale
              onPress={() => void submit()}
              disabled={!canSubmit || busy}
              accessibilityRole="button"
              className={`mt-5 h-14 flex-row items-center justify-center gap-2 rounded-2xl ${
                !canSubmit || busy ? 'bg-slate-300' : 'bg-ink active:bg-ink-dark'
              }`}
            >
              {busy && <ActivityIndicator size="small" color="#ffffff" />}
              <Text className="text-base font-bold text-white">
                {isRegister ? 'Create account' : 'Sign in'}
              </Text>
            </PressableScale>

            <PressableScale
              onPress={browseAsGuest}
              accessibilityRole="button"
              className="mt-3 h-14 items-center justify-center rounded-2xl border-2 border-ink active:bg-slate-50"
            >
              <Text className="text-base font-bold text-ink">Continue as Guest</Text>
            </PressableScale>
          </Animated.View>

          <PressableScale
            onPress={swap}
            accessibilityRole="button"
            className="mt-6 items-center py-2"
          >
            <Text className="font-sans text-[15px] text-slate-400">
              {isRegister ? 'Already have an account? ' : "Don't have an account? "}
              <Text className="font-bold text-ink">
                {isRegister ? 'Sign in' : 'Sign up'}
              </Text>
            </Text>
          </PressableScale>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Banner({
  tone,
  icon,
  text,
}: {
  tone: 'error' | 'notice';
  icon: ComponentProps<typeof Ionicons>['name'];
  text: string;
}) {
  const error = tone === 'error';
  return (
    <View
      className={`mt-4 flex-row items-center gap-2 rounded-xl px-3 py-2.5 ${
        error ? 'bg-red-50' : 'bg-brand/10'
      }`}
    >
      <Ionicons name={icon} size={16} color={error ? '#dc2626' : '#006e59'} />
      <Text
        className={`font-sans flex-1 text-xs ${error ? 'text-red-700' : 'text-brand'}`}
      >
        {text}
      </Text>
    </View>
  );
}

function Field({
  icon,
  trailing,
  ...props
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  trailing?: ReactNode;
} & ComponentProps<typeof TextInput>) {
  return (
    <View className="h-16 flex-row items-center gap-3 rounded-2xl border border-slate-300 bg-white px-4">
      <Ionicons name={icon} size={20} color="#334155" />
      <TextInput
        placeholderTextColor="#94a3b8"
        autoCorrect={false}
        className="h-full flex-1 text-base text-ink"
        {...props}
      />
      {trailing}
    </View>
  );
}
