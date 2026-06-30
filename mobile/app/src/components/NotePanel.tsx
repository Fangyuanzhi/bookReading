import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { Note } from '../api/config';
import { theme } from '../theme';

interface ReadingTheme {
  bg: string;
  text: string;
  accent: string;
  bgPanel?: string;
  bgRaised?: string;
  line?: string;
}

interface NotePanelProps {
  paragraphIndex: number;
  paragraphText: string;
  notes: Note[];
  readingTheme: ReadingTheme;
  onClose: () => void;
  onSubmit: (body: string) => Promise<void>;
  onLike: (noteId: string, hasLiked?: boolean) => Promise<void>;
}

function formatTime(iso?: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export default function NotePanel({
  paragraphIndex,
  paragraphText,
  notes,
  readingTheme,
  onClose,
  onSubmit,
  onLike,
}: NotePanelProps) {
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [likingId, setLikingId] = useState<string | null>(null);

  const panelBg = readingTheme.bgPanel || theme.bgPanel;
  const raisedBg = readingTheme.bgRaised || theme.bgRaised;
  const lineColor = readingTheme.line || theme.line;

  const handleSubmit = async () => {
    if (!body.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(body.trim());
      setBody('');
    } catch (err) {
      setError((err as Error).message || '发送失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (note: Note) => {
    if (note.has_liked || likingId) return;
    setLikingId(note.id);
    try {
      await onLike(note.id, note.has_liked);
    } finally {
      setLikingId(null);
    }
  };

  return (
    <View style={[styles.panel, { backgroundColor: panelBg, borderColor: lineColor }]}>
      <View style={[styles.header, { borderBottomColor: lineColor }]}>
        <View style={styles.headerText}>
          <Text style={[styles.headerLabel, { color: theme.soft }]}>
            段评 · 第 {paragraphIndex + 1} 段
          </Text>
          <Text style={[styles.quote, { color: readingTheme.text }]} numberOfLines={2}>
            {paragraphText}
          </Text>
        </View>
        <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
          <Text style={{ color: theme.soft, fontSize: 20 }}>×</Text>
        </Pressable>
      </View>

      <View style={[styles.compose, { borderBottomColor: lineColor }]}>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: raisedBg, color: readingTheme.text, borderColor: lineColor },
          ]}
          value={body}
          onChangeText={setBody}
          placeholder="写下此刻的想法…"
          placeholderTextColor={theme.faint}
          multiline
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable
          style={[
            styles.submitBtn,
            { backgroundColor: readingTheme.accent },
            (submitting || !body.trim()) && { opacity: 0.5 },
          ]}
          onPress={handleSubmit}
          disabled={submitting || !body.trim()}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitText}>发表段评</Text>
          )}
        </Pressable>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {notes.length === 0 ? (
          <Text style={styles.empty}>还没有段评，来做第一个吧</Text>
        ) : (
          notes.map((note) => (
            <View key={note.id} style={[styles.noteCard, { backgroundColor: raisedBg }]}>
              <View style={styles.noteHeader}>
                <Text style={[styles.author, { color: readingTheme.accent }]}>
                  {note.user?.display_name || '读者'}
                </Text>
                <Text style={styles.time}>
                  {formatTime((note as Note & { created_at?: string }).created_at)}
                </Text>
              </View>
              <Text style={[styles.noteBody, { color: readingTheme.text }]}>{note.body}</Text>
              <Pressable
                style={styles.likeRow}
                onPress={() => handleLike(note)}
                disabled={note.has_liked || likingId === note.id}
              >
                <Text
                  style={[
                    styles.likeIcon,
                    { color: note.has_liked ? readingTheme.accent : theme.soft },
                  ]}
                >
                  {note.has_liked ? '♥' : '♡'}
                </Text>
                <Text style={[styles.likeCount, { color: theme.soft }]}>
                  {note.likes ?? 0}
                </Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    maxHeight: '72%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    gap: 8,
  },
  headerText: { flex: 1, gap: 4 },
  headerLabel: { fontSize: 13 },
  quote: { fontSize: 14, lineHeight: 20 },
  closeBtn: { padding: 4 },
  compose: {
    padding: 16,
    gap: 10,
    borderBottomWidth: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    minHeight: 72,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  error: { fontSize: 13, color: theme.danger },
  submitBtn: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  list: { flexGrow: 0 },
  listContent: { padding: 16, gap: 12, paddingBottom: 24 },
  empty: { textAlign: 'center', color: theme.faint, fontSize: 14, paddingVertical: 24 },
  noteCard: { borderRadius: 12, padding: 12, gap: 8 },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  author: { fontSize: 14, fontWeight: '600' },
  time: { fontSize: 11, color: theme.faint },
  noteBody: { fontSize: 14, lineHeight: 22 },
  likeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  likeIcon: { fontSize: 16 },
  likeCount: { fontSize: 12 },
});
