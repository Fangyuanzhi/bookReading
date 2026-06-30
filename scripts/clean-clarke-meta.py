#!/usr/bin/env python3
"""Remove editorial/meta paragraphs from clarke-fountains chapters."""

from pathlib import Path

META_PREFIXES = (
    "读这本书之前",
    "本数据包",
    "在接下来的章节里",
    "最后提醒阅读姿态",
    "重读",
    "重访",
    "读到这里",
    "不妨",
    "锡兰的热带光线在克拉克笔下",
    "卡里达萨与摩根的并置",
    "喷泉与电梯",
    "僧侣线的意义",
    "科拉与菩提达摩的对照",
    "克拉克写高空作业时",
    "公主从未真正出场演说",
    "耶迦加拉的旅游化",
    "蜘蛛机器人在真空爬行",
    "硬对接一词听起来",
    "若把本书当建筑史读",
    "克拉克很少写家庭温暖",
    "古代部的暴力在文本里",
    "克拉克是硬科幻的诗人",
    "两条时间线如何交汇",
    "本书也是关于「中断」",
    "当夜风吹过耶迦加拉",
    "第一部在文学上最接近",
)

ROOT = Path(__file__).resolve().parents[1] / "data" / "clarke-fountains" / "chapters"


def clean_text(text: str) -> str:
    lines = text.splitlines()
    kept: list[str] = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            if kept and kept[-1] != "":
                kept.append("")
            continue
        if any(stripped.startswith(prefix) for prefix in META_PREFIXES):
            break
        if "克拉克" in stripped and any(
            k in stripped for k in ("读者", "文本", "第二部", "第三部", "第一部", "尾声", "章节")
        ):
            # Skip lines that break the fourth wall about the novel structure.
            if any(k in stripped for k in ("读者", "文本", "章节", "部最", "部以", "部结束", "部也", "部写成")):
                break
        kept.append(line)
    while kept and kept[-1] == "":
        kept.pop()
    return "\n".join(kept) + "\n"


def main() -> None:
    for path in sorted(ROOT.glob("*.txt")):
        if path.name.startswith("01-"):
            continue
        original = path.read_text(encoding="utf-8")
        cleaned = clean_text(original)
        if cleaned != original:
            path.write_text(cleaned, encoding="utf-8")
            print(f"cleaned {path.name}")


if __name__ == "__main__":
    main()
