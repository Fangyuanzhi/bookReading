// 前端使用示例
// 将此代码复制到前端项目中的组件里

import api, { CentrifugoClient } from './api/config.js';

// ============ 认证示例 ============

// 注册
async function register() {
  try {
    const result = await api.auth.register({
      email: 'user@example.com',
      password: '123456',
      display_name: '新用户'
    });
    console.log('注册成功:', result);
    api.client.setToken(result.data.token);
  } catch (error) {
    console.error('注册失败:', error.message);
  }
}

// 登录
async function login() {
  try {
    const result = await api.auth.login({
      email: 'user@example.com',
      password: '123456'
    });
    console.log('登录成功:', result);
    api.client.setToken(result.data.token);
  } catch (error) {
    console.error('登录失败:', error.message);
  }
}

// 获取当前用户
async function getCurrentUser() {
  try {
    const result = await api.auth.me();
    console.log('当前用户:', result.data);
  } catch (error) {
    console.error('获取失败:', error.message);
  }
}

// ============ 书籍示例 ============

// 获取书籍列表
async function getBooks() {
  try {
    const result = await api.books.list({ page: 1, page_size: 10 });
    console.log('书籍列表:', result.data.books);
  } catch (error) {
    console.error('获取失败:', error.message);
  }
}

// 获取书籍详情
async function getBookDetail(bookId) {
  try {
    const result = await api.books.detail(bookId);
    console.log('书籍详情:', result.data);
  } catch (error) {
    console.error('获取失败:', error.message);
  }
}

// ============ 章节示例 ============

// 获取章节内容
async function getChapter(chapterId) {
  try {
    const result = await api.chapters.detail(chapterId);
    console.log('章节内容:', result.data);
    return result.data;
  } catch (error) {
    console.error('获取失败:', error.message);
  }
}

// 获取章节段评
async function getChapterNotes(chapterId) {
  try {
    const result = await api.chapters.notes(chapterId);
    console.log('段评列表:', result.data);
    return result.data;
  } catch (error) {
    console.error('获取失败:', error.message);
  }
}

// 加入章节阅读（触发"N人在读"）
async function joinChapter(chapterId) {
  try {
    const result = await api.chapters.join(chapterId, { display_name: '夜读者' });
    console.log('加入成功:', result.data);
    return result.data.count; // 当前在场人数
  } catch (error) {
    console.error('加入失败:', error.message);
  }
}

// 离开章节
async function leaveChapter(chapterId) {
  try {
    const result = await api.chapters.leave(chapterId, { display_name: '夜读者' });
    console.log('离开成功:', result.data);
  } catch (error) {
    console.error('离开失败:', error.message);
  }
}

// ============ 段评示例 ============

// 创建段评
async function createNote(bookId, chapterId, cfi, textQuote, body) {
  try {
    const result = await api.notes.create({
      book_id: bookId,
      chapter_id: chapterId,
      cfi: cfi,              // EPUB CFI 定位
      text_quote: textQuote, // 被划选的原文
      body: body,            // 想法内容
      is_public: true
    });
    console.log('段评创建成功:', result.data);
    return result.data;
  } catch (error) {
    console.error('创建失败:', error.message);
  }
}

// 点赞段评
async function likeNote(noteId) {
  try {
    await api.notes.like(noteId);
    console.log('点赞成功');
  } catch (error) {
    console.error('点赞失败:', error.message);
  }
}

// ============ 书评示例 ============

// 创建章末书评
async function createChapterReview(bookId, chapterId, body) {
  try {
    const result = await api.reviews.create({
      book_id: bookId,
      chapter_id: chapterId,
      body: body
    });
    console.log('书评创建成功:', result.data);
    return result.data;
  } catch (error) {
    console.error('创建失败:', error.message);
  }
}

// ============ 实时推送示例 ============

// 初始化 Centrifugo
const centrifugo = new CentrifugoClient();

// 连接
function connectRealtime() {
  centrifugo.connect();
}

// 订阅章节实时更新
function subscribeChapterRealtime(chapterId, onNoteCreated, onPresenceUpdate) {
  const unsubscribe = centrifugo.subscribeChapter(chapterId, (data) => {
    console.log('收到实时消息:', data);

    if (data.type === 'note_created') {
      onNoteCreated?.(data.data);
    } else if (data.type === 'presence_update') {
      onPresenceUpdate?.(data.data);
    }
  });

  // 返回取消订阅函数
  return unsubscribe;
}

// ============ React Hook 示例 ============

// useChapter.js - 章节阅读 Hook
/*
import { useState, useEffect } from 'react';
import api, { CentrifugoClient } from './api/config.js';

export function useChapter(chapterId) {
  const [chapter, setChapter] = useState(null);
  const [notes, setNotes] = useState([]);
  const [presence, setPresence] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 加载章节数据
    const loadChapter = async () => {
      const [chapterData, notesData, presenceData] = await Promise.all([
        api.chapters.detail(chapterId),
        api.chapters.notes(chapterId),
        api.chapters.presence(chapterId),
      ]);
      setChapter(chapterData.data);
      setNotes(notesData.data);
      setPresence(presenceData.data.count);
      setLoading(false);
    };

    loadChapter();

    // 加入章节
    api.chapters.join(chapterId, { display_name: '读者' });

    // 订阅实时更新
    const centrifugo = new CentrifugoClient();
    centrifugo.connect();
    const unsubscribe = centrifugo.subscribeChapter(chapterId, (data) => {
      if (data.type === 'note_created') {
        setNotes(prev => [data.data, ...prev]);
      } else if (data.type === 'presence_update') {
        setPresence(data.data.count);
      }
    });

    // 心跳保活
    const heartbeat = setInterval(() => {
      api.presence.heartbeat(chapterId);
    }, 30000);

    return () => {
      unsubscribe();
      clearInterval(heartbeat);
      api.chapters.leave(chapterId);
    };
  }, [chapterId]);

  // 创建段评
  const createNote = async (cfi, textQuote, body) => {
    const result = await api.notes.create({
      book_id: chapter.book_id,
      chapter_id: chapterId,
      cfi,
      text_quote: textQuote,
      body,
      is_public: true,
    });
    return result.data;
  };

  return { chapter, notes, presence, loading, createNote };
}
*/

// ============ 使用示例 ============

async function main() {
  // 1. 登录
  await login();

  // 2. 获取书籍列表
  await getBooks();

  // 3. 获取章节内容
  const chapterId = '11cec2b5-6227-4f46-ad77-d819220772cc';
  const chapter = await getChapter(chapterId);

  // 4. 获取段评
  const notes = await getChapterNotes(chapterId);

  // 5. 加入章节阅读
  const count = await joinChapter(chapterId);
  console.log(`当前 ${count} 人在读`);

  // 6. 创建段评
  await createNote(
    chapter.book_id,
    chapterId,
    'epubcfi(/6/2[id4]!/4/2)',
    '雨是从黄昏开始下的',
    '这句写得很有氛围感！'
  );

  // 7. 连接实时推送
  connectRealtime();
  subscribeChapterRealtime(
    chapterId,
    (note) => console.log('新段评:', note),
    (presence) => console.log('在场更新:', presence)
  );
}

export {
  register,
  login,
  getCurrentUser,
  getBooks,
  getBookDetail,
  getChapter,
  getChapterNotes,
  joinChapter,
  leaveChapter,
  createNote,
  likeNote,
  createChapterReview,
  connectRealtime,
  subscribeChapterRealtime,
  centrifugo,
};
