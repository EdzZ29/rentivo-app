import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PressableScale from '@/components/motion/PressableScale';
import { Skeleton } from '@/components/Skeleton';
import { api, type LegalDocument } from '@/lib/api';
import { DURATION, stagger } from '@/lib/motion';

/**
 * One legal document, fetched from the API.
 *
 * Rendered by the five thin routes under app/legal/. They are separate static
 * files rather than one [slug] route because expo-router's typed-routes
 * generator omits nested dynamic routes, which made every push() untypeable.
 *
 * The text is served rather than bundled so the app and the website can't drift
 * apart on what the policies say — and so a policy revision doesn't need an app
 * store release to take effect.
 *
 * Laid out as a document, not an app screen: a serif face, one narrow centred
 * column with wide margins, and centred small-caps section headings. Type is
 * small with generous leading — the register of a printed policy rather than
 * of the surrounding interface.
 */
export default function LegalDocumentScreen({ slug }: { slug: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [doc, setDoc] = useState<LegalDocument | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();
    api.legal
      .get(slug, controller.signal)
      .then((d) => {
        if (!controller.signal.aborted) {
          setDoc(d);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Could not load this document.');
      });
    return () => controller.abort();
  }, [slug]);

  // Derived rather than reset in the effect: while the requested slug and the
  // loaded document disagree, we're still fetching.
  const current = doc?.slug === slug ? doc : null;

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* Just a way back — the document supplies its own title below, centred,
          the way a printed policy would. */}
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="flex-row items-center border-b border-slate-100 bg-white px-4 pb-2"
      >
        <PressableScale
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/account'))}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={10}
          className="h-10 w-10 items-center justify-center rounded-full"
        >
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </PressableScale>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 72 }}
        contentContainerClassName="px-8 pt-14"
      >
        {!!error && (
          <View className="flex-row items-center gap-2 rounded-xl bg-red-50 px-3 py-3">
            <Ionicons name="alert-circle-outline" size={16} color="#dc2626" />
            <Text className="flex-1 text-xs text-red-700">{error}</Text>
          </View>
        )}

        {!current && !error && (
          <View className="gap-7" pointerEvents="none">
            <View className="items-center gap-3">
              <Skeleton w="70%" h={30} r={8} />
            </View>
            {Array.from({ length: 3 }, (_, i) => (
              <View key={i} className="gap-3">
                <Skeleton w="45%" h={14} />
                <Skeleton w="100%" h={13} />
                <Skeleton w="97%" h={13} />
                <Skeleton w="88%" h={13} />
              </View>
            ))}
          </View>
        )}

        {current && (
          <>
            {/* Title: large and light, centred, with room to breathe. */}
            <Text className="text-center font-serif text-[26px] font-normal leading-9 text-slate-900">
              {current.title}
            </Text>

            <Text className="mt-12 font-serif text-[11px] font-bold text-slate-500">
              Last updated: {current.effectiveDate}
            </Text>

            <Text className="mt-6 font-serif text-[14px] leading-[26px] text-slate-700">
              {current.summary}
            </Text>

            {current.sections.map((section, i) => (
              <Animated.View
                key={section.heading}
                entering={FadeInDown.duration(DURATION.base).delay(stagger(i))}
                style={{ marginTop: 44 }}
              >
                <Text className="text-center font-serif text-xs font-bold uppercase tracking-[1.5px] text-slate-900">
                  {section.heading}
                </Text>
                {section.body.map((paragraph, j) => (
                  <Text key={j} className="mt-4 font-serif text-[14px] leading-[26px] text-slate-700">
                    {paragraph}
                  </Text>
                ))}
                {section.bullets?.map((bullet, j) => (
                  <View key={j} className="mt-4 flex-row gap-3">
                    <View className="mt-2.5 h-1 w-1 rounded-full bg-slate-400" />
                    <Text className="flex-1 font-serif text-[14px] leading-[26px] text-slate-700">
                      {bullet}
                    </Text>
                  </View>
                ))}
              </Animated.View>
            ))}

            <Text className="mt-16 text-center font-serif text-[11px] text-slate-400">
              Version {current.version}
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}
