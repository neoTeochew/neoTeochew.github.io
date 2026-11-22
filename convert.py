#!/usr/bin/env python3
"""把辞典 APP 导出的冗余数据转换成站点使用的 data.json 格式。

用法：
    python convert.py [输入文件] [输出文件]
    python convert.py data_new.json data.json 

默认读取 data_new.json，写出 data_converted.json。
要直接替换站点数据可执行：python convert.py data_new.json data.json

转换内容：
  1. 删除词条级冗余字段 hanzi / categories / examples（导出里恒为空）；
  2. definitions 里的 tyangi -> meaning，dingyi -> meaning_hanzi；
  3. examples 里的 liku -> sentence，liju -> sentence_hanzi；
  4. 其余字段原样保留，并保持 data.json 的键顺序与缩进格式。
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def convert_example(example):
    return {
        "sentence": example["liku"],
        "sentence_hanzi": example["liju"],
        "translations": example["translations"],
    }


def convert_definition(definition):
    return {
        "hanzi": definition["hanzi"],
        "categories": definition["categories"],
        "speech": definition["speech"],
        "meaning": definition["tyangi"],
        "meaning_hanzi": definition["dingyi"],
        "translations": definition["translations"],
        "examples": [convert_example(e) for e in definition["examples"]],
    }


def convert_word(word):
    return {
        "word": word["word"],
        "pronunciations": word["pronunciations"],
        "accents": word["accents"],
        "shengmu": word["shengmu"],
        "yunmu": word["yunmu"],
        "tone": word["tone"],
        "definitions": [convert_definition(d) for d in word["definitions"]],
        "phrases": word["phrases"],
        "tips": word["tips"],
    }


def main():
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "data_new.json"
    dst = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "data_converted.json"

    with src.open(encoding="utf-8") as f:
        data = json.load(f)

    result = {"words": [convert_word(w) for w in data["words"]]}

    with dst.open("w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print("已转换 %d 个词条：%s -> %s" % (len(result["words"]), src.name, dst.name))


if __name__ == "__main__":
    main()
