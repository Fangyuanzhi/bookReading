import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NotePanel from '../components/NotePanel';
import PresenceBar from '../components/PresenceBar';
import { useChapter } from '../hooks/useChapter';
import { useReadingProgressSaver } from '../hooks/useReadingProgress';
import type { RootStackParamList } from '../navigation/params';
import { groupNotesByParagraph } from '../utils/paragraph';
import { readingThemes, theme, type ReadingThemeKey } from '../theme';

type Route = RouteProp<RootStackParamList, 'Reader'>;

export default function ReaderScreen() {
  const { params } = useRoute<Route>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { chapterId, bookTitle } = params;

  const { chapter, paragraphs, notes, presence, loading, error, fromCache, createNote, likeNote } =
    useChapter(chapterId);
  const [themeKey, setThemeKey] = useState<ReadingThemeKey>('paper');
  const [showChrome, setShowChrome] = useState(true);
  const [selectedPara, setSelectedPara] = useState<number | null>(null);
  const [visiblePara, setVisiblePara] = useState(0);

  useReadingProgressSaver(chapter?.book_id, chapterId, visiblePara);

  const rt = readingThemes[themeKey];
  const notesByPara = groupNotesByParagraph(notes, paragraphs);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: rt.bg }]}>
        <ActivityIndicator color={rt.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: rt.bg }]}>
        <Text style={{ color: theme.danger }}>{error}</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ color: rt.accent }}>返回</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: rt.bg }]}>
      {showChrome ? (
        <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: theme.line }]}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Text style={[styles.back, { color: rt.accent }]}>‹ 返回</Text>
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerBook, { color: rt.text }]} numberOfLines={1}>
              {bookTitle || '陪读'}
            </Text>
            <Text style={[styles.headerChapter, { color: theme.soft }]} numberOfLines={1}>
              {chapter?.title}
            </Text>
          </View>
          <Pressable onPress={() => setShowChrome(false)} hitSlop={12}>
            <Text style={{ color: rt.accent, fontSize: 13 }}>沉浸</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable style={styles.immersiveTap} onPress={() => setShowChrome(true)} />
      )}

      {fromCache ? (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>离线缓存 · 联网后自动更新</Text>
        </View>
      ) : null}

      {showChrome && presence.count > 0 ? (
        <PresenceBar count={presence.count} accent={rt.accent} />
      ) : null}

      <FlatList
        data={paragraphs}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.article}
        onScrollBeginDrag={() => setShowChrome(false)}
        onViewableItemsChanged={({ viewableItems }) => {
          const first = viewableItems[0];
          if (first?.index != null) setVisiblePara(first.index);
        }}
        viewabilityConfig={{ itemVisiblePercentThreshold: 40 }}
        renderItem={({ item, index }) => {
          const paraNotes = notesByPara.get(index) || [];
          return (
            <Pressable
              onPress={() => {
                setSelectedPara(index);
                setShowChrome(true);
              }}
              style={[
                styles.para,
                selectedPara === index && { backgroundColor: `${rt.accent}14` },
              ]}
            >
              <Text style={[styles.paraText, { color: rt.text, lineHeight: 28 }]}>
                {item}
              </Text>
              {paraNotes.length > 0 ? (
                <View style={styles.noteBadge}>
                  <Text style={[styles.noteBadgeText, { color: rt.accent }]}>
                    {paraNotes.length} 条段评
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        }}
      />

      {showChrome ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 8, borderTopColor: theme.line }]}>
          <View style={styles.themeRow}>
            {(Object.keys(readingThemes) as ReadingThemeKey[]).map((key) => (
              <Pressable
                key={key}
                onPress={() => setThemeKey(key)}
                style={[
                  styles.themeChip,
                  themeKey === key && { borderColor: rt.accent, backgroundColor: `${rt.accent}14` },
                ]}
              >
                <Text style={{ fontSize: 12, color: themeKey === key ? rt.accent : theme.soft }}>
                  {readingThemes[key].label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.footerHint}>段评实时同步 · 点击段落写段评</Text>
        </View>
      ) : null}

      <Modal visible={selectedPara !== null} transparent animationType="slide">
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedPara(null)} />
        {selectedPara !== null ? (
          <View style={{ paddingBottom: insets.bottom }}>
            <NotePanel
              paragraphIndex={selectedPara}
              paragraphText={paragraphs[selectedPara] || ''}
              notes={notesByPara.get(selectedPara) || []}
              readingTheme={rt}
              onClose={() => setSelectedPara(null)}
              onSubmit={async (body) => {
                await createNote(selectedPara, body);
              }}
              onLike={likeNote}
            />
          </View>
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  backBtn: { padding: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.92)',
    gap: 8,
  },
  back: { fontSize: 16, fontWeight: '500', minWidth: 56 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerBook: { fontSize: 14, fontWeight: '600' },
  headerChapter: { fontSize: 12, marginTop: 2 },
  offlineBanner: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  offlineText: { fontSize: 12, color: '#92400E', textAlign: 'center' },
  immersiveTap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 48,
    zIndex: 10,
  },
  article: { paddingHorizontal: 20, paddingVertical: 24, maxWidth: 680, alignSelf: 'center', width: '100%' },
  para: {
    marginBottom: 20,
    padding: 8,
    borderRadius: 8,
  },
  paraText: { fontSize: 17 },
  noteBadge: { marginTop: 8 },
  noteBadgeText: { fontSize: 12, fontWeight: '500' },
  footer: {
    borderTopWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  themeRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  themeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.line,
  },
  footerHint: { textAlign: 'center', fontSize: 11, color: theme.faint },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
});
