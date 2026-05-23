#!/usr/bin/env python3
"""Premium MiniMate Demo Video Builder - Clean rewrite"""

import os
import math
from PIL import Image, ImageDraw, ImageFont

# === CONFIG ===
W, H = 1920, 1080
FPS = 30
OUT_DIR = "/root/minimate/demo/frames"
os.makedirs(OUT_DIR, exist_ok=True)

# Colors
BG_DARK = (10, 10, 12)
BG_CARD = (22, 22, 26)
GREEN = (52, 211, 153)
GREEN_DIM = (16, 185, 129)
WHITE = (255, 255, 255)
GRAY = (161, 161, 170)
GRAY_DIM = (113, 113, 122)
GRAY_DARK = (39, 39, 42)
ACCENT_BLUE = (96, 165, 250)

# Fonts
FONT_BOLD = "/usr/share/fonts/truetype/lato/Lato-Bold.ttf"
FONT_REG = "/usr/share/fonts/truetype/lato/Lato-Regular.ttf"
FONT_LIGHT = "/usr/share/fonts/truetype/lato/Lato-Light.ttf"

def font(size, bold=False, light=False):
    path = FONT_LIGHT if light else (FONT_BOLD if bold else FONT_REG)
    return ImageFont.truetype(path, size)

def ease_out_cubic(t):
    return 1 - (1 - t) ** 3

def lerp(a, b, t):
    return a + (b - a) * t

def lerp_color(c1, c2, t):
    return tuple(int(lerp(a, b, t)) for a, b in zip(c1, c2))

def draw_rounded_rect(draw, xy, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)

def draw_gradient_bg(img, color_top=BG_DARK, color_bot=(15, 25, 20)):
    draw = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        c = lerp_color(color_top, color_bot, t)
        draw.line([(0, y), (W, y)], fill=c)

def draw_glow(img, cx, cy, radius, color, alpha=30):
    overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    for r in range(radius, 0, -2):
        a = int(alpha * (r / radius) ** 0.5)
        d.ellipse([cx-r, cy-r, cx+r, cy+r], fill=(*color, a))
    img.paste(Image.alpha_composite(Image.new('RGBA', img.size, (0,0,0,0)), overlay).convert('RGB'), mask=overlay)

def draw_phone_mockup(img, screenshot_path, x, y, phone_w=340, phone_h=700):
    draw = ImageDraw.Draw(img)
    frame_w = phone_w + 20
    frame_h = phone_h + 20
    fx = x - 10
    fy = y - 10
    draw_rounded_rect(draw, [fx, fy, fx + frame_w, fy + frame_h],
                      radius=30, fill=(30, 30, 34), outline=(60, 60, 66), width=2)
    try:
        scr = Image.open(screenshot_path).convert('RGB')
        scr = scr.resize((phone_w, phone_h), Image.LANCZOS)
        img.paste(scr, (x, y))
    except:
        draw_rounded_rect(draw, [x, y, x + phone_w, y + phone_h], radius=20, fill=BG_CARD)
    notch_w = 80
    notch_h = 6
    nx = x + (phone_w - notch_w) // 2
    draw_rounded_rect(draw, [nx, y + 8, nx + notch_w, y + 8 + notch_h], radius=3, fill=(50, 50, 54))

def draw_fade_text(draw, text, pos, fnt, color, progress=1.0):
    if progress <= 0:
        return
    alpha = ease_out_cubic(min(progress, 1.0))
    faded = lerp_color(BG_DARK, color, alpha)
    draw.text(pos, text, font=fnt, fill=faded)


# ==============================
# SCENES
# ==============================

def scene_intro(frame_num, total_frames):
    img = Image.new('RGB', (W, H), BG_DARK)
    draw_gradient_bg(img, (10, 10, 12), (8, 20, 15))
    draw = ImageDraw.Draw(img)
    t = frame_num / total_frames

    glow_p = ease_out_cubic(min(t * 3, 1.0))
    if glow_p > 0:
        draw_glow(img, W//2, H//2 - 40, int(300 * glow_p), GREEN, alpha=int(20 * glow_p))
        draw = ImageDraw.Draw(img)

    title_fnt = font(96, bold=True)
    title = "MiniMate"
    bbox = draw.textbbox((0, 0), title, font=title_fnt)
    tw = bbox[2] - bbox[0]
    tp = ease_out_cubic(min((t - 0.1) * 3, 1.0))
    if tp > 0:
        ty = int(H // 2 - 100 + 50 * (1 - tp))
        draw_fade_text(draw, title, ((W - tw) // 2, ty), title_fnt, GREEN, tp)

    sub_fnt = font(32, light=True)
    subtitle = "AI Finance Assistant on Celo"
    bbox2 = draw.textbbox((0, 0), subtitle, font=sub_fnt)
    sw = bbox2[2] - bbox2[0]
    sp = ease_out_cubic(min((t - 0.3) * 3, 1.0))
    if sp > 0:
        sy = int(H // 2 + 20 + 30 * (1 - sp))
        draw_fade_text(draw, subtitle, ((W - sw) // 2, sy), sub_fnt, GRAY, sp)

    line_p = ease_out_cubic(min((t - 0.4) * 2.5, 1.0))
    if line_p > 0:
        lw = int(200 * line_p)
        lx = (W - lw) // 2
        draw.line([(lx, H//2 + 55), (lx + lw, H//2 + 55)], fill=GREEN_DIM, width=2)

    pp = ease_out_cubic(min((t - 0.5) * 3, 1.0))
    if pp > 0:
        powered = "Powered by Farcaster  ·  Built for MiniPay"
        pb = draw.textbbox((0, 0), powered, font=font(22, light=True))
        pw = pb[2] - pb[0]
        draw_fade_text(draw, powered, ((W - pw) // 2, H // 2 + 80), font(22, light=True), GRAY_DIM, pp)

    return img


def scene_chat(frame_num, total_frames):
    img = Image.new('RGB', (W, H), BG_DARK)
    draw_gradient_bg(img, (10, 10, 12), (8, 16, 14))
    draw = ImageDraw.Draw(img)
    t = frame_num / total_frames

    sp = ease_out_cubic(min(t * 3, 1.0))
    if sp > 0:
        draw_fade_text(draw, "CHAT INTERFACE", (120, 200), font(18, bold=True), GREEN, sp)
        draw_fade_text(draw, "Natural Language", (120, 250), font(48, bold=True), WHITE, sp)
        draw_fade_text(draw, "Finance Assistant", (120, 310), font(48, bold=True), WHITE, ease_out_cubic(min((t-0.1)*3, 1.0)))
        draw_fade_text(draw, "Ask anything about your finances", (120, 390), font(22, light=True), GRAY, ease_out_cubic(min((t-0.2)*3, 1.0)))
        draw_fade_text(draw, "in plain language. No complex", (120, 420), font(22, light=True), GRAY, ease_out_cubic(min((t-0.25)*3, 1.0)))
        draw_fade_text(draw, "commands needed.", (120, 450), font(22, light=True), GRAY, ease_out_cubic(min((t-0.3)*3, 1.0)))

        bt = ease_out_cubic(min((t - 0.4) * 2.5, 1.0))
        if bt > 0:
            by = 530
            draw_rounded_rect(draw, [120, by, 400, by + 44], radius=22, fill=GREEN)
            draw.text((140, by + 10), "\"What's my balance?\"", font=font(16), fill=BG_DARK)
            b2t = ease_out_cubic(min((t - 0.55) * 2.5, 1.0))
            if b2t > 0:
                draw_rounded_rect(draw, [120, by + 60, 440, by + 104], radius=22, fill=GRAY_DARK)
                draw.text((140, by + 70), "Here are your balances...", font=font(16), fill=WHITE)

    phone_p = ease_out_cubic(min((t - 0.15) * 2, 1.0))
    if phone_p > 0:
        phone_x = int(lerp(W + 100, W - 550, phone_p))
        draw_phone_mockup(img, "/root/.hermes/image_cache/img_bf0f747e0055.jpg",
                         phone_x, 140, phone_w=380, phone_h=790)
    return img


def scene_balance(frame_num, total_frames):
    img = Image.new('RGB', (W, H), BG_DARK)
    draw_gradient_bg(img, (10, 10, 12), (5, 18, 12))
    draw = ImageDraw.Draw(img)
    t = frame_num / total_frames

    gp = ease_out_cubic(min(t * 2.5, 1.0))
    if gp > 0:
        draw_glow(img, W//2, H//2, int(400 * gp), GREEN, alpha=int(15 * gp))
        draw = ImageDraw.Draw(img)

    cp = ease_out_cubic(min(t * 2, 1.0))
    if cp > 0:
        card_w, card_h = 500, 400
        cx = (W - card_w) // 2
        cy = int(lerp(H + 50, (H - card_h) // 2 - 30, cp))
        draw_rounded_rect(draw, [cx, cy, cx + card_w, cy + card_h], radius=24, fill=BG_CARD, outline=(40, 40, 44), width=1)
        draw.text((cx + 30, cy + 25), "Your Balances", font=font(28, bold=True), fill=WHITE)

        items = [("CELO", "0.3082", GREEN), ("USDm", "0.00", ACCENT_BLUE),
                 ("USDC", "0.00", (100, 100, 255)), ("USDT", "0.00", (38, 161, 123))]
        for i, (token, amount, color) in enumerate(items):
            it = ease_out_cubic(min((t - 0.3 - i*0.1) * 3, 1.0))
            if it > 0:
                iy = cy + 90 + i * 70
                ix = cx + 30
                draw.ellipse([ix, iy, ix + 40, iy + 40], fill=color)
                draw.text((ix + 10, iy + 8), token[0], font=font(20, bold=True), fill=WHITE)
                faded = lerp_color(BG_CARD, WHITE, it)
                draw.text((ix + 55, iy + 5), token, font=font(20, bold=True), fill=faded)
                draw.text((ix + 55, iy + 28), f"{amount} {token}", font=font(14, light=True), fill=lerp_color(BG_CARD, GRAY, it))
                if i < len(items) - 1:
                    draw.line([(ix, iy + 55), (ix + card_w - 60, iy + 55)], fill=(40, 40, 44), width=1)

    lt = ease_out_cubic(min((t - 0.5) * 3, 1.0))
    if lt > 0:
        draw_fade_text(draw, "FEATURE", ((W - 100)//2, H - 120), font(18, bold=True), GREEN, lt)
        name = "Real-Time Balance"
        nb = draw.textbbox((0,0), name, font=font(36, bold=True))
        nw = nb[2] - nb[0]
        draw_fade_text(draw, name, ((W - nw)//2, H - 90), font(36, bold=True), WHITE, lt)
    return img


def scene_spending(frame_num, total_frames):
    """Spending breakdown with colored circle icons (no emoji)"""
    img = Image.new('RGB', (W, H), BG_DARK)
    draw_gradient_bg(img, (10, 10, 12), (12, 10, 18))
    draw = ImageDraw.Draw(img)
    t = frame_num / total_frames

    dt = ease_out_cubic(min(t * 2.5, 1.0))
    if dt > 0:
        draw_fade_text(draw, "FEATURE", (140, 220), font(18, bold=True), GREEN, dt)
        draw_fade_text(draw, "Spending", (140, 260), font(56, bold=True), WHITE, dt)
        draw_fade_text(draw, "Breakdown", (140, 330), font(56, bold=True), WHITE, ease_out_cubic(min((t-0.1)*3, 1.0)))
        for i, line in enumerate(["Auto-categorized transactions", "Track where your money goes", "Powered by Blockscout API"]):
            lt = ease_out_cubic(min((t - 0.25 - i*0.08) * 3, 1.0))
            draw_fade_text(draw, line, (140, 420 + i*35), font(20, light=True), GRAY, lt)

    categories = [
        ("F", "Food & Dining", 45, (255, 140, 50)),
        ("T", "Transport", 25, (80, 180, 255)),
        ("S", "Shopping", 15, (255, 100, 150)),
        ("B", "Bills & Utilities", 35, (255, 215, 0)),
        ("E", "Entertainment", 10, (168, 85, 247)),
        ("D", "Education", 5, (52, 211, 153)),
    ]
    card_x = W // 2 + 50
    for i, (letter, name, pct, color) in enumerate(categories):
        ct = ease_out_cubic(min((t - 0.3 - i*0.07) * 3, 1.0))
        if ct > 0:
            cy = 160 + i * 80
            cw, ch = 420, 65
            draw_rounded_rect(draw, [card_x, cy, card_x + cw, cy + ch], radius=16, fill=BG_CARD, outline=(40, 40, 44), width=1)
            # Colored circle icon
            icon_x, icon_y, icon_s = card_x + 20, cy + 14, 36
            draw.ellipse([icon_x, icon_y, icon_x + icon_s, icon_y + icon_s], fill=color)
            lbb = draw.textbbox((0,0), letter, font=font(18, bold=True))
            lw, lh = lbb[2] - lbb[0], lbb[3] - lbb[1]
            draw.text((icon_x + (icon_s - lw)//2, icon_y + (icon_s - lh)//2 - 2), letter, font=font(18, bold=True), fill=BG_DARK)
            draw.text((card_x + 70, cy + 10), name, font=font(18, bold=True), fill=WHITE)
            # Progress bar
            bx, by2 = card_x + 70, cy + 40
            bw, bh = cw - 170, 8
            draw_rounded_rect(draw, [bx, by2, bx + bw, by2 + bh], radius=4, fill=(30, 30, 34))
            fw = int(bw * pct / 100 * ct)
            if fw > 0:
                draw_rounded_rect(draw, [bx, by2, bx + fw, by2 + bh], radius=4, fill=color)
            draw.text((card_x + cw - 55, cy + 18), f"{pct}%", font=font(16, bold=True), fill=color)
    return img


def scene_send(frame_num, total_frames):
    img = Image.new('RGB', (W, H), BG_DARK)
    draw_gradient_bg(img, (10, 10, 12), (10, 15, 20))
    draw = ImageDraw.Draw(img)
    t = frame_num / total_frames

    tt = ease_out_cubic(min(t * 2.5, 1.0))
    if tt > 0:
        draw_fade_text(draw, "FEATURE", (W//2 - 50, 100), font(18, bold=True), GREEN, tt)
        title = "Send Payment"
        tb = draw.textbbox((0,0), title, font=font(52, bold=True))
        tw = tb[2] - tb[0]
        draw_fade_text(draw, title, ((W-tw)//2, 140), font(52, bold=True), WHITE, tt)

    steps = [
        ("1", "Enter Amount", "\"Send 1 CELO\"", GREEN),
        ("2", "Confirm Details", "Address + Token", ACCENT_BLUE),
        ("3", "Approve in Wallet", "MiniPay popup", (168, 85, 247)),
        ("4", "Done!", "Transaction confirmed", GREEN),
    ]
    start_x = 140
    step_w = 380
    step_gap = 50

    for i, (num, title, desc, color) in enumerate(steps):
        st = ease_out_cubic(min((t - 0.2 - i*0.12) * 2.5, 1.0))
        if st > 0:
            sx = start_x + i * (step_w + step_gap)
            sy = H // 2 - 80
            if i > 0:
                lt = ease_out_cubic(min((t - 0.2 - (i-0.5)*0.12) * 2.5, 1.0))
                if lt > 0:
                    lx1 = sx - step_gap
                    lx2 = int(lerp(lx1, sx, lt))
                    ly = sy + 70
                    draw.line([(lx1, ly), (lx2, ly)], fill=GRAY_DARK, width=2)
                    if lt > 0.8:
                        draw.polygon([(lx2-8, ly-6), (lx2, ly), (lx2-8, ly+6)], fill=GRAY_DIM)
            card_h = 180
            cy = int(lerp(sy + 80, sy, st))
            draw_rounded_rect(draw, [sx, cy, sx + step_w, cy + card_h], radius=20, fill=BG_CARD, outline=(*color, int(80*st)), width=1)
            # Step number
            circle_x = sx + step_w // 2 - 22
            circle_y = cy - 22
            draw.ellipse([circle_x, circle_y, circle_x + 44, circle_y + 44], fill=color)
            draw.text((circle_x + 16, circle_y + 8), num, font=font(22, bold=True), fill=BG_DARK)
            # Title
            tbb = draw.textbbox((0,0), title, font=font(24, bold=True))
            ttw = tbb[2] - tbb[0]
            draw.text((sx + (step_w - ttw)//2, cy + 35), title, font=font(24, bold=True), fill=WHITE)
            # Desc
            dbb = draw.textbbox((0,0), desc, font=font(18, light=True))
            dw = dbb[2] - dbb[0]
            draw.text((sx + (step_w - dw)//2, cy + 75), desc, font=font(18, light=True), fill=GRAY)

    nt = ease_out_cubic(min((t - 0.6) * 3, 1.0))
    if nt > 0:
        note = "Step-by-step guided flow  ·  No confusion  ·  Clear at every step"
        nb = draw.textbbox((0,0), note, font=font(18, light=True))
        nw = nb[2] - nb[0]
        draw_fade_text(draw, note, ((W-nw)//2, H - 100), font(18, light=True), GRAY_DIM, nt)
    return img


def scene_goals(frame_num, total_frames):
    img = Image.new('RGB', (W, H), BG_DARK)
    draw_gradient_bg(img, (10, 10, 12), (15, 12, 8))
    draw = ImageDraw.Draw(img)
    t = frame_num / total_frames

    dt = ease_out_cubic(min(t * 2.5, 1.0))
    if dt > 0:
        draw_fade_text(draw, "FEATURE", (140, 240), font(18, bold=True), GREEN, dt)
        draw_fade_text(draw, "Savings Goals", (140, 280), font(48, bold=True), WHITE, dt)
        for i, line in enumerate(["Set financial targets", "Track progress visually", "Get insights on your habits"]):
            lt = ease_out_cubic(min((t - 0.2 - i*0.08) * 3, 1.0))
            draw_fade_text(draw, line, (140, 370 + i*38), font(20, light=True), GRAY, lt)

    goals = [
        ("L", "New Laptop", 800, 500, GREEN),
        ("V", "Vacation Fund", 1200, 450, ACCENT_BLUE),
        ("E", "Emergency Fund", 2000, 1600, (168, 85, 247)),
    ]
    gx = W // 2 + 80
    for i, (letter, name, target, current, color) in enumerate(goals):
        gt = ease_out_cubic(min((t - 0.3 - i*0.12) * 2.5, 1.0))
        if gt > 0:
            gy = 200 + i * 200
            gw, gh = 480, 170
            draw_rounded_rect(draw, [gx, gy, gx + gw, gy + gh], radius=20, fill=BG_CARD, outline=(40, 40, 44), width=1)
            # Icon
            icon_x, icon_y, icon_s = gx + 25, gy + 18, 40
            draw.ellipse([icon_x, icon_y, icon_x + icon_s, icon_y + icon_s], fill=color)
            lbb = draw.textbbox((0,0), letter, font=font(20, bold=True))
            lw = lbb[2] - lbb[0]
            draw.text((icon_x + (icon_s - lw)//2, icon_y + 6), letter, font=font(20, bold=True), fill=BG_DARK)
            draw.text((gx + 80, gy + 22), name, font=font(22, bold=True), fill=WHITE)
            pct = current / target
            draw.text((gx + 25, gy + 70), f"${current:,.0f} / ${target:,.0f}", font=font(18), fill=GRAY)
            # Progress bar
            bx, by2, bw, bh = gx + 25, gy + 105, gw - 50, 14
            draw_rounded_rect(draw, [bx, by2, bx + bw, by2 + bh], radius=7, fill=(30, 30, 34))
            fw = int(bw * pct * gt)
            if fw > 4:
                draw_rounded_rect(draw, [bx, by2, bx + fw, by2 + bh], radius=7, fill=color)
            draw.text((gx + gw - 60, gy + 22), f"{int(pct*100*gt)}%", font=font(20, bold=True), fill=color)
    return img


def scene_outro(frame_num, total_frames):
    img = Image.new('RGB', (W, H), BG_DARK)
    draw_gradient_bg(img, (10, 10, 12), (8, 20, 15))
    draw = ImageDraw.Draw(img)
    t = frame_num / total_frames

    gp = ease_out_cubic(min(t * 2, 1.0))
    if gp > 0:
        draw_glow(img, W//2, H//2, int(500 * gp), GREEN, alpha=int(25 * gp))
        draw = ImageDraw.Draw(img)

    tt = ease_out_cubic(min(t * 2, 1.0))
    if tt > 0:
        fnt = font(80, bold=True)
        title = "MiniMate"
        bb = draw.textbbox((0,0), title, font=fnt)
        tw = bb[2] - bb[0]
        ty = int(lerp(H//2 - 120, H//2 - 100, tt))
        draw_fade_text(draw, title, ((W-tw)//2, ty), fnt, GREEN, tt)

    tg = ease_out_cubic(min((t - 0.2) * 2.5, 1.0))
    if tg > 0:
        tag = "Your AI Finance Companion on Celo"
        tb = draw.textbbox((0,0), tag, font=font(28, light=True))
        tw = tb[2] - tb[0]
        draw_fade_text(draw, tag, ((W-tw)//2, H//2 - 10), font(28, light=True), WHITE, tg)

    bt = ease_out_cubic(min((t - 0.4) * 2.5, 1.0))
    if bt > 0:
        badges = ["Celo", "Farcaster", "MiniPay"]
        badge_colors = [GREEN, (168, 85, 247), ACCENT_BLUE]
        badge_y = H//2 + 60
        total_w = len(badges) * 220
        start_x = (W - total_w) // 2
        for i, (badge, bcolor) in enumerate(zip(badges, badge_colors)):
            bbt = ease_out_cubic(min((t - 0.4 - i*0.08) * 3, 1.0))
            if bbt > 0:
                bx = start_x + i * 220
                draw_rounded_rect(draw, [bx, badge_y, bx + 200, badge_y + 44], radius=22, fill=BG_CARD, outline=(*bcolor, int(100*bbt)), width=1)
                # Colored dot
                dot_x = bx + 18
                dot_y = badge_y + 17
                draw.ellipse([dot_x, dot_y, dot_x + 10, dot_y + 10], fill=bcolor)
                draw.text((bx + 36, badge_y + 10), badge, font=font(18, bold=True), fill=WHITE)

    urlt = ease_out_cubic(min((t - 0.55) * 2.5, 1.0))
    if urlt > 0:
        url = "minimate-green.vercel.app"
        ub = draw.textbbox((0,0), url, font=font(22))
        uw = ub[2] - ub[0]
        draw_fade_text(draw, url, ((W-uw)//2, H//2 + 140), font(22), GREEN_DIM, urlt)

    cta = ease_out_cubic(min((t - 0.65) * 2.5, 1.0))
    if cta > 0:
        cta_w, cta_h = 280, 56
        cta_x = (W - cta_w) // 2
        cta_y = H//2 + 190
        draw_rounded_rect(draw, [cta_x, cta_y, cta_x + cta_w, cta_y + cta_h], radius=28, fill=GREEN)
        cta_text = "Try it now  ->"
        ctb = draw.textbbox((0,0), cta_text, font=font(22, bold=True))
        ctw = ctb[2] - ctb[0]
        draw.text((cta_x + (cta_w - ctw)//2, cta_y + 14), cta_text, font=font(22, bold=True), fill=BG_DARK)
    return img


# ==============================
# MAIN
# ==============================

scenes = [
    (scene_intro, 4.0),
    (scene_chat, 5.0),
    (scene_balance, 5.0),
    (scene_spending, 5.0),
    (scene_send, 7.0),
    (scene_goals, 5.0),
    (scene_outro, 5.0),
]

TRANSITION_FRAMES = int(FPS * 0.5)
frame_idx = 0
total_video_frames = sum(int(dur * FPS) for _, dur in scenes)

print(f"Generating {total_video_frames} frames at {FPS}fps...")

for scene_num, (scene_fn, duration) in enumerate(scenes):
    num_frames = int(duration * FPS)
    print(f"  Scene {scene_num+1}: {scene_fn.__name__} ({num_frames} frames)")
    for i in range(num_frames):
        img = scene_fn(i, num_frames)
        if scene_num < len(scenes) - 1 and i >= num_frames - TRANSITION_FRAMES:
            fade_t = (i - (num_frames - TRANSITION_FRAMES)) / TRANSITION_FRAMES
            darkener = Image.new('RGB', (W, H), BG_DARK)
            img = Image.blend(img, darkener, fade_t * 0.7)
        if i < TRANSITION_FRAMES:
            fade_t = i / TRANSITION_FRAMES
            darkener = Image.new('RGB', (W, H), BG_DARK)
            img = Image.blend(darkener, img, ease_out_cubic(fade_t))
        img.save(os.path.join(OUT_DIR, f"frame_{frame_idx:05d}.png"))
        frame_idx += 1

print(f"Done! Generated {frame_idx} frames in {OUT_DIR}")
