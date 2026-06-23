# 《理想国》数据包

## 来源

- **原著**：柏拉图《理想国》（公版）
- **英文底本**：Project Gutenberg [#1497](https://www.gutenberg.org/ebooks/1497)（Benjamin Jowett 英译，公有领域）
- **中文**：本项目据上述公版英译整理为**简体中文**，术语见 `glossary.json`

## 十卷结构

| 文件 | 标题 | 约字数 |
|---|---|---|
| `01-第一卷.txt` | 第一卷 | 21,584 |
| `02-第二卷.txt` | 第二卷 | 17,151 |
| … | … | … |
| `10-第十卷.txt` | 第十卷 | 18,739 |

## 术语校验

```bash
python3 scripts/validate-republic-zh.py
```

检查项：无残留英文专名、各卷篇幅、核心术语（苏格拉底、正义、城邦、灵魂等）全局出现。

## 重新导入书库

```bash
python3 scripts/update-book.py \
  --book-id 33631cda-65b8-459c-9c18-69984cade79c \
  data/plato-republic
```

## 从英文重新提取（可选）

```bash
# 需本地已有 Gutenberg 文本片段（见 scripts/extract-republic-en.py）
python3 scripts/extract-republic-en.py
```

## 在线阅读

http://127.0.0.1:3000/book/33631cda-65b8-459c-9c18-69984cade79c
