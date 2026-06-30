# 《十二个对抗众神的人》数据包

## 来源

- **原著**：William Bolitho《Twelve Against the Gods: The Story of Adventure》（1929，公版）
- **作者**：William Bolitho Ryall（1891–1930），南非裔记者、传记作家
- **中文**：本项目据上述公版英译整理为**简体中文**，术语见 `glossary.json`

## 结构（13 章）

| 文件 | 标题 | 人物 |
|---|---|---|
| `01-引言.txt` | 引言 | 论冒险与顺从 |
| `02-亚历山大.txt` | 亚历山大 | 亚历山大大帝 |
| `03-卡萨诺瓦.txt` | 卡萨诺瓦 | 贾科莫·卡萨诺瓦 |
| … | … | … |
| `13-伍德罗·威尔逊.txt` | 伍德罗·威尔逊 | 伍德罗·威尔逊 |

## 术语校验

```bash
python3 scripts/validate-twelve-zh.py
```

## 导入书库

```bash
python3 scripts/import-book.py data/twelve-against-gods
```

当前书库 ID：`a97d3f9d-9907-4904-ab4d-f204ef7c9da6`

## 更新已有条目

```bash
python3 scripts/update-book.py --book-id a97d3f9d-9907-4904-ab4d-f204ef7c9da6 data/twelve-against-gods
```

## 从英文底本提取（可选）

将公版 TXT 放入 `source/en/full.txt` 后：

```bash
python3 scripts/extract-twelve-en.py
```

## 在线阅读

http://127.0.0.1:3000/book/a97d3f9d-9907-4904-ab4d-f204ef7c9da6
