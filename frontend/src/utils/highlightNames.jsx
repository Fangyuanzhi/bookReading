import republicCharacters from '../data/republic-characters.json';
import twelveCharacters from '../data/twelve-characters.json';
import fountainsCharacters from '../data/fountains-characters.json';
import singularityCharacters from '../data/singularity-characters.json';
import alteredCarbonCharacters from '../data/altered-carbon-characters.json';

const NAME_SET = new Set([
  ...republicCharacters.characters,
  ...twelveCharacters.characters,
  ...fountainsCharacters.characters,
  ...singularityCharacters.characters,
  ...alteredCarbonCharacters.characters,
]);

/** 按书名匹配需高亮的人名列表（长名优先已在 split 逻辑中处理） */
export function getBookCharacterNames(book) {
  if (!book) return [];
  const title = (book.title || '').toLowerCase();
  const author = (book.author || '').toLowerCase();
  if (title.includes('理想国') || title.includes('republic')) {
    return republicCharacters.characters;
  }
  if (
    title.includes('十二个对抗众神') ||
    title.includes('twelve against the gods') ||
    author.includes('博利托') ||
    author.includes('bolitho')
  ) {
    return twelveCharacters.characters;
  }
  if (
    title.includes('天堂的喷泉') ||
    title.includes('fountains of paradise') ||
    author.includes('克拉克') ||
    author.includes('clarke')
  ) {
    return fountainsCharacters.characters;
  }
  if (
    title.includes('奇点天空') ||
    title.includes('singularity sky') ||
    author.includes('斯特罗斯') ||
    author.includes('stross')
  ) {
    return singularityCharacters.characters;
  }
  if (
    title.includes('副本') ||
    title.includes('altered carbon') ||
    author.includes('摩根') ||
    author.includes('morgan')
  ) {
    return alteredCarbonCharacters.characters;
  }
  return [];
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildNameRegex(names) {
  const sorted = [...names].sort((a, b) => b.length - a.length);
  if (sorted.length === 0) return null;
  return new RegExp(`(${sorted.map(escapeRegExp).join('|')})`, 'g');
}

/** 将段落文本按人名拆分为 React 节点 */
export function highlightCharacterNames(text, names, keyPrefix = '', theme) {
  if (!text || !names?.length) return text;

  const regex = buildNameRegex(names);
  if (!regex) return text;

  const parts = text.split(regex);
  if (parts.length === 1) return text;

  return parts.map((part, i) => {
    if (!part) return null;
    if (NAME_SET.has(part) || names.includes(part)) {
      return (
        <mark
          key={`${keyPrefix}${i}`}
          className="reader-name"
          style={
            theme
              ? { color: theme.text, backgroundColor: theme.bgRaised }
              : undefined
          }
        >
          {part}
        </mark>
      );
    }
    return part;
  });
}
