"""生成 OG 分享卡片图（1200x630），风格与网站一致：灰底、细边框、细体大标题。
用法：python scripts/generate-og-image.py
"""
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "og-image.png"

W, H = 1200, 630
BG = "#e8e8e8"
FG = "#1a1a1a"
MUTED = "#555555"


def load_font(candidates, size):
    for name in candidates:
        path = Path("C:/Windows/Fonts") / name
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def main():
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)

    # 细边框框架（呼应网站）
    draw.rectangle([40, 40, W - 40, H - 40], outline=FG, width=2)

    # 稀疏的粒子流线装饰（呼应流动背景）
    random.seed(42)
    for _ in range(120):
        x = random.uniform(60, W - 60)
        y = random.uniform(60, H - 60)
        draw.line([x, y, x + random.uniform(-14, 14), y + random.uniform(-14, 14)],
                  fill="#c8c8c8", width=2)

    name_font = load_font(["msyhl.ttc", "msyh.ttc", "simhei.ttf"], 110)
    role_font = load_font(["msyhbd.ttc", "msyh.ttc"], 40)
    small_font = load_font(["consola.ttf", "msyh.ttc"], 28)

    # 左上：名字 + 角色
    draw.text((90, 110), "汤宇凡", font=name_font, fill=FG)
    draw.text((95, 260), "Developer in Training", font=role_font, fill=FG)

    # 左下：方形符号（呼应 favicon）
    draw.rectangle([95, H - 160, 125, H - 130], fill=FG)
    draw.text((145, H - 168), "PORTFOLIO", font=small_font, fill=MUTED)

    # 右下：一句话简介
    draw.text((W - 90, H - 165), "用一个个小项目，把学到的知识变成作品。",
              font=role_font, fill=FG, anchor="ra")

    OUT.parent.mkdir(exist_ok=True)
    img.save(OUT)
    print(f"已生成 {OUT}")


if __name__ == "__main__":
    main()
