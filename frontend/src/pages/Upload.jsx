import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, BookOpen, CheckCircle2, AlertCircle } from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';
import { APP_THEME, APP_CLASSES } from '../styles/theme';
import api from '../api/config';

const ACCEPT = '.epub,.txt';
const MAX_SIZE_MB = 50;

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function UploadPageContent() {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [language, setLanguage] = useState('zh');
  const [licenseNote, setLicenseNote] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const validateFile = useCallback((f) => {
    if (!f) return '请选择文件';
    const ext = f.name.toLowerCase();
    if (!ext.endsWith('.epub') && !ext.endsWith('.txt')) {
      return '仅支持 .epub 和 .txt 文件';
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      return `文件不能超过 ${MAX_SIZE_MB}MB`;
    }
    return '';
  }, []);

  const pickFile = useCallback(
    (f) => {
      const msg = validateFile(f);
      if (msg) {
        setError(msg);
        setFile(null);
        return;
      }
      setError('');
      setSuccess(null);
      setFile(f);
      if (!title) {
        setTitle(f.name.replace(/\.(epub|txt)$/i, ''));
      }
    },
    [title, validateFile],
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) pickFile(f);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('请先选择 EPUB 或 TXT 文件');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(null);

    try {
      const result = await api.upload.book(file, {
        title: title.trim(),
        author: author.trim(),
        language: language.trim(),
        license_note: licenseNote.trim(),
      });

      const book = result.data?.book;
      const converted = result.data?.converted;
      const chaptersCount = result.data?.chapters_count ?? 0;

      setSuccess({
        bookId: book?.id,
        title: book?.title || title,
        chaptersCount,
        converted,
        sourceFormat: result.data?.source_format,
      });
    } catch (err) {
      setError(err.message || '上传失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const isTxt = file?.name?.toLowerCase().endsWith('.txt');

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-semibold mb-2">导入书籍</h1>
        <p className="text-sm opacity-70">
          支持 EPUB 与 TXT。TXT 会在服务端自动转为 EPUB 并按章节入库。
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div
          className={`${APP_CLASSES.card} p-8 border-2 border-dashed transition-colors cursor-pointer`}
          style={{
            backgroundColor: APP_THEME.bgPanel,
            borderColor: dragOver ? APP_THEME.accent : APP_THEME.line,
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0])}
          />

          <div className="flex flex-col items-center text-center gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: APP_THEME.glow }}
            >
              <Upload size={28} style={{ color: APP_THEME.accent }} />
            </div>
            <p className="font-medium">点击或拖拽文件到此处</p>
            <p className="text-sm opacity-60">.epub / .txt，最大 {MAX_SIZE_MB}MB</p>
          </div>

          {file && (
            <div
              className="mt-6 flex items-center gap-3 p-4 rounded-xl border"
              style={{ backgroundColor: APP_THEME.bgRaised, borderColor: APP_THEME.line }}
              onClick={(e) => e.stopPropagation()}
            >
              {isTxt ? (
                <FileText size={22} style={{ color: APP_THEME.accent }} />
              ) : (
                <BookOpen size={22} style={{ color: APP_THEME.accent }} />
              )}
              <div className="flex-1 min-w-0 text-left">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-sm opacity-60">
                  {formatSize(file.size)}
                  {isTxt && ' · 上传后将自动转为 EPUB'}
                </p>
              </div>
              <button
                type="button"
                className={APP_CLASSES.btnGhost}
                onClick={() => {
                  setFile(null);
                  if (inputRef.current) inputRef.current.value = '';
                }}
              >
                移除
              </button>
            </div>
          )}
        </div>

        <div className={`${APP_CLASSES.card} p-6 space-y-4`} style={{ backgroundColor: APP_THEME.bgPanel, borderColor: APP_THEME.line }}>
          <h2 className="font-serif text-lg">书籍信息（可选）</h2>
          <p className="text-sm opacity-60 -mt-2">
            TXT 文件通常没有元数据，建议填写书名与作者；EPUB 会以文件内信息为准，此处可覆盖。
          </p>

          <div>
            <label className="block text-sm mb-1.5 opacity-80">书名</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={APP_CLASSES.input}
              placeholder="例如：理想国"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1.5 opacity-80">作者</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className={APP_CLASSES.input}
                placeholder="例如：柏拉图"
              />
            </div>
            <div>
              <label className="block text-sm mb-1.5 opacity-80">语言</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={APP_CLASSES.input}
              >
                <option value="zh">中文</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1.5 opacity-80">版权说明</label>
            <input
              type="text"
              value={licenseNote}
              onChange={(e) => setLicenseNote(e.target.value)}
              className={APP_CLASSES.input}
              placeholder="例如：公版书 / 用户自有版权"
            />
          </div>
        </div>

        {error && (
          <div
            className="flex items-start gap-2 p-4 rounded-xl text-sm border"
            style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', borderColor: 'rgba(220, 38, 38, 0.3)', color: '#fca5a5' }}
          >
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            className="p-4 rounded-xl text-sm border"
            style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.3)', color: '#86efac' }}
          >
            <div className="flex items-start gap-2">
              <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">《{success.title}》导入成功</p>
                <p className="opacity-90 mt-1">
                  共 {success.chaptersCount} 章
                  {success.converted && ' · 已从 TXT 转为 EPUB'}
                </p>
                <button
                  type="button"
                  className="mt-3 underline hover:opacity-80"
                  onClick={() => navigate(`/book/${success.bookId}`)}
                >
                  查看书籍详情 →
                </button>
              </div>
            </div>
          </div>
        )}

        <button type="submit" disabled={loading || !file} className={APP_CLASSES.btnPrimary}>
          {loading ? '上传并解析中…' : '开始导入'}
        </button>
      </form>
    </div>
  );
}

export default function UploadPage() {
  return (
    <ProtectedRoute>
      <UploadPageContent />
    </ProtectedRoute>
  );
}
