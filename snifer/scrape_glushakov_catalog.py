#!/usr/bin/env python3
"""
Сбор каталога iPhone (от 15-го поколения), MacBook, iPad, Watch, AirPods с внешнего магазина.

Запуск из папки snifer:
  pip install -r requirements.txt
  python scrape_glushakov_catalog.py --category iphone
  python scrape_glushakov_catalog.py --category macbook
  python scrape_glushakov_catalog.py --all

  --iphone-min-gen 15   по умолчанию: только iPhone 15+ (и iPhone Air, 17e)

Выход: output/iphones.json, macbooks.json, ipads.json, watches.json, airpods.json
"""

from __future__ import annotations

import argparse
import json
import re
import time
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, unquote, urljoin, urlparse

import requests
from bs4 import BeautifulSoup

BASE = "https://www.glushakov-official.ru"
SLEEP_SEC = 0.35

SESSION = requests.Session()
SESSION.headers.update(
    {"User-Agent": "Mozilla/5.0 (compatible; VeganCatalogBot/1.0; +https://example.invalid)"}
)


def fetch(url: str) -> str:
    last: Exception | None = None
    for attempt in range(3):
        try:
            r = SESSION.get(url, timeout=45)
            r.raise_for_status()
            return r.text
        except requests.RequestException as e:
            last = e
            if attempt < 2:
                time.sleep(1.2 * (attempt + 1))
    if last is None:
        raise RuntimeError("fetch: no request attempted")
    raise last


def parse_price_rub(html: str, page_url: str = "") -> int:
    """Цена конфигурации: из RSC (\\\"price\\\") рядом со slug страницы; иначе эвристика по ₽ в HTML."""
    slug = ""
    if page_url:
        slug = urlparse(page_url).path.rstrip("/").split("/")[-1]
    scoped: int | None = None
    if slug:
        m = re.search(
            re.escape(slug) + r'.{0,400}?\\"price\\":(\d+)',
            html,
            re.DOTALL,
        )
        if m:
            scoped = int(m.group(1))
        else:
            m2 = re.search(
                re.escape(slug) + r'.{0,400}?"price":(\d+)',
                html,
                re.DOTALL,
            )
            if m2:
                scoped = int(m.group(1))
    if scoped is not None:
        return scoped

    amounts: list[int] = []
    for m in re.finditer(r"([\d\s\u00a0\.]{4,})\s*₽", html):
        digits = re.sub(r"\D", "", m.group(1))
        if not digits:
            continue
        n = int(digits)
        # отсекаем типичные мелкие суммы доставки / сервиса на странице
        if n < 5000:
            continue
        amounts.append(n)
    return max(amounts) if amounts else 0


def availability_from_text(text: str) -> str:
    tl = text.lower()
    if "скоро в продаже" in tl:
        return "coming_soon"
    if "нет в наличии" in tl:
        return "out_of_stock"
    return "unknown"


def _rsc_bool_after_slug(html: str, slug: str, key: str) -> bool | None:
    """Из RSC: \\"key\\":true|false сразу после slug варианта."""
    if not slug:
        return None
    m = re.search(
        re.escape(slug) + r".{0,700}?\\\"" + re.escape(key) + r"\\\":(true|false)",
        html,
        re.DOTALL | re.I,
    )
    if not m:
        return None
    return m.group(1).lower() == "true"


def refine_availability(
    html: str, text: str, price: int, page_url: str = ""
) -> str:
    av = availability_from_text(text)
    if av != "unknown":
        return av
    slug = ""
    if page_url:
        slug = urlparse(page_url).path.rstrip("/").split("/")[-1]
    coming_soon_flag = _rsc_bool_after_slug(html, slug, "comingSoon")
    in_stock_flag = _rsc_bool_after_slug(html, slug, "inStock")
    if coming_soon_flag is True:
        return "coming_soon"
    if price == 0 and in_stock_flag is False:
        return "out_of_stock"
    tl = text.lower()
    if price > 0 and ("в корзину" in tl or "купить" in tl):
        return "in_stock"
    return "unknown"


def collect_product_images(soup: BeautifulSoup, limit: int = 16) -> list[str]:
    """URL с CDN донора: /img/... и развёрнутые из /_next/image?url=..."""
    urls: list[str] = []
    seen: set[str] = set()
    skip = ("favicon", "logo-n", "mc.yandex", "/icon/", "placeholder")

    def add_candidate(u: str) -> None:
        u = u.strip()
        if not u or u.startswith("data:"):
            return
        low = u.lower()
        if any(s in low for s in skip):
            return
        if "glushakov-official.ru" not in u and not u.startswith(BASE):
            return
        if u not in seen:
            seen.add(u)
            urls.append(u)

    def resolve_src(raw: str) -> None:
        raw = raw.strip()
        if not raw:
            return
        full = urljoin(BASE, raw)
        if "/_next/image" in full:
            try:
                qs = parse_qs(urlparse(full).query)
                path = (qs.get("url") or [None])[0]
                if path:
                    path = unquote(path)
                    full = path if path.startswith("http") else urljoin(BASE, path)
            except Exception:
                return
        add_candidate(full)

    for img in soup.find_all("img"):
        src = img.get("src")
        if src:
            resolve_src(src)
        srcset = img.get("srcset") or ""
        for chunk in srcset.split(","):
            part = chunk.strip().split()
            if part:
                resolve_src(part[0])
    for src in soup.select("picture source[src]"):
        resolve_src(src.get("src") or "")

    product = [u for u in urls if "/img/" in u]
    if product:
        urls = product

    def sort_key(u: str) -> tuple[int, str]:
        low = u.lower()
        if re.search(r"/front\.(webp|png|jpe?g)", low):
            return (0, u)
        return (1, u)

    urls = sorted(set(urls), key=sort_key)
    return urls[:limit]


def path_parts(url: str) -> list[str]:
    return [p for p in urlparse(url).path.strip("/").split("/") if p]


def discover_models(category: str) -> dict[str, str]:
    """slug -> title from listing page."""
    list_url = f"{BASE}/catalog/{category}"
    html = fetch(list_url)
    soup = BeautifulSoup(html, "html.parser")
    out: dict[str, str] = {}
    for a in soup.select("a[href]"):
        href = a.get("href") or ""
        full = urljoin(BASE, href)
        parts = path_parts(full)
        if len(parts) == 3 and parts[0] == "catalog" and parts[1] == category:
            slug = parts[2]
            title = a.get_text(" ", strip=True)
            if len(title) > 55:
                continue
            if re.search(r"\d+\s*GB", title, re.I):
                continue
            if "Цвет" in title or "Добавлено" in title or " Память " in title:
                continue
            if slug and title and len(slug) > 1:
                out[slug] = title
    time.sleep(SLEEP_SEC)
    return out


def discover_skus_for_model(category: str, model_slug: str) -> set[str]:
    url = f"{BASE}/catalog/{category}/{model_slug}"
    html = fetch(url)
    soup = BeautifulSoup(html, "html.parser")
    skus: set[str] = set()
    for a in soup.select("a[href]"):
        href = a.get("href") or ""
        full = urljoin(BASE, href)
        parts = path_parts(full)
        if (
            len(parts) == 4
            and parts[0] == "catalog"
            and parts[1] == category
            and parts[2] == model_slug
        ):
            skus.add(full)
    time.sleep(SLEEP_SEC)
    return skus


def char_map_from_soup(soup: BeautifulSoup) -> dict[str, str]:
    raw = soup.get_text(" ", strip=True)
    mapping: dict[str, str] = {}

    def grab(label: str, pattern: str) -> None:
        m = re.search(pattern, raw, flags=re.I)
        if m:
            mapping[label] = m.group(1).strip()

    grab("color", r"Цвет\s*([A-Za-zА-Яа-яёЁ0-9][A-Za-zА-Яа-яёЁ0-9\s\-\+]*?)(?=Диагональ|Объём|Связь|Год|Все\s+варианты|$)")
    grab("diagonal", r"Диагональ\s+([\d\"\.]+)")
    grab("storage", r"Объём\s*памяти\s+([^\s]+)")
    grab("connectivity", r"Связь\s+([^\s]+)")
    return mapping


def normalize_storage(raw: str) -> str:
    s = raw.strip().upper().replace(" ", "")
    s = s.replace("ГБ", "GB").replace("ТБ", "TB")
    m = re.match(r"^(\d+)(GB|TB)$", s)
    if m:
        n, u = m.groups()
        return f"{n} {'ТБ' if u == 'TB' else 'ГБ'}"
    return raw.strip()


def normalize_connectivity(raw: str) -> str:
    x = raw.strip().lower()
    if "lte" in x or "cellular" in x:
        return "Wi‑Fi + Cellular"
    if "wifi" in x or "wi-fi" in x:
        return "Wi‑Fi"
    return raw.strip()


def parse_watch_slug(sku_slug: str) -> dict[str, str]:
    """Из slug SKU (watch11_46_rosegold_sm) достаём размер / цвет / ремешок."""
    parts = sku_slug.lower().strip().split("_")
    if len(parts) < 4:
        return {}
    # ищем размер корпуса: 40, 42, 44, 46, 49
    size_idx = None
    for i, p in enumerate(parts):
        if re.fullmatch(r"\d{2}", p) and p in {"40", "41", "42", "44", "45", "46", "49"}:
            size_idx = i
            break
    if size_idx is None:
        return {}
    size = parts[size_idx]
    band = parts[-1]
    color_tokens = parts[size_idx + 1 : -1]
    if not color_tokens:
        return {}
    color = " ".join(t.replace("-", " ").title() for t in color_tokens)
    band_map = {"sm": "S/M", "ml": "M/L", "s": "S/M", "m": "M/L"}
    sim = band_map.get(band, band.upper())
    return {"screen": f"{size} mm", "color": color, "simType": sim}


def color_from_ipad_h1(title: str) -> str:
    t = title.strip()
    m = re.search(r'\(2025\)\s+\d+"\s*\d+\s*GB\s+(\w+)', t, re.I)
    if m:
        return m.group(1).strip()
    m = re.search(r'\(2025\)\s+\d+\s*GB\s+(\w+)', t, re.I)
    if m:
        return m.group(1).strip()
    m = re.search(r'\(2025\)\s+([A-Za-z]+)\s+\d+\s*GB', t, re.I)
    if m:
        return m.group(1).strip()
    m = re.search(r"\d+\s*GB\s+(\w+)\s*(?:wifi|Wi-Fi)", t, re.I)
    if m:
        return m.group(1).strip()
    return ""


def color_from_ipad_slug(slug: str) -> str:
    tail = slug.lower().replace("_lte", "").split("_")[-1]
    cmap = {
        "blue": "Blue",
        "pink": "Pink",
        "yellow": "Yellow",
        "silver": "Silver",
        "purple": "Purple",
        "starlight": "Starlight",
        "black": "Black",
        "spacegray": "Space Gray",
        "spaceblack": "Space Black",
        "natural": "Natural Titanium",
        "orange": "Orange",
        "white": "White",
    }
    return cmap.get(tail, tail.replace("_", " ").title() if tail.isalpha() else "")


def connectivity_from_ipad(title: str, sku_url: str) -> str:
    low = (title + " " + sku_url).lower()
    if "lte" in low or "cellular" in low or "wifi+lte" in low.replace("‑", "-"):
        return "Wi‑Fi + Cellular"
    return "Wi‑Fi"


def screen_from_ipad(title: str, sku_slug: str) -> str:
    m = re.search(r'(\d{2})"\s*\d+\s*GB', title, re.I)
    if m:
        return f'{m.group(1)}"'
    m2 = re.search(r"\s(11|13)\s+\d+GB", title, re.I)
    if m2:
        return f'{m2.group(1)}"'
    for token in sku_slug.lower().split("_"):
        if token in ("11", "13"):
            return f'{token}"'
    parts = sku_slug.lower().split("_")
    for i, p in enumerate(parts):
        if p in ("11", "13") and i > 0 and re.fullmatch(r"\d+.*", parts[i - 1]):
            return f'{p}"'
    return ""


def parse_ipad_variant(sku_url: str, model_name: str) -> dict[str, Any] | None:
    html = fetch(sku_url)
    time.sleep(SLEEP_SEC)
    soup = BeautifulSoup(html, "html.parser")
    h1 = soup.find("h1")
    if not h1:
        return None
    title = h1.get_text(" ", strip=True)
    text = soup.get_text(" ", strip=True)
    price = parse_price_rub(html, sku_url)
    av = refine_availability(html, text, price, sku_url)
    sku_slug = path_parts(sku_url)[-1]
    ch = char_map_from_soup(soup)
    color = color_from_ipad_h1(title)
    if not color or "памят" in color.lower() or len(color) > 24:
        color = color_from_ipad_slug(sku_slug)
    memory = ""
    if ch.get("storage"):
        memory = normalize_storage(ch["storage"])
    if not memory:
        m = re.search(r"(\d+)\s*GB", title, re.I)
        if m:
            memory = normalize_storage(f"{m.group(1)}GB")
        else:
            m2 = re.search(r"(\d+)\s*TB", title, re.I)
            if m2:
                memory = normalize_storage(f"{m2.group(1)}TB")
    screen = screen_from_ipad(title, sku_slug)
    if ch.get("diagonal") and not screen:
        d = ch["diagonal"].strip().strip('"')
        screen = f'{d}"' if d else ""
    sim_type = connectivity_from_ipad(title, sku_url)
    if ch.get("connectivity") and "lte" not in title.lower() and "_lte" not in sku_slug.lower():
        sim_type = normalize_connectivity(ch["connectivity"])

    if not color:
        return None

    if not screen and re.search(r"ipad\s+11\b", model_name, re.I):
        screen = '11"'

    return {
        "model": model_name,
        "title": title,
        "color": color,
        "screen": screen,
        "storage": memory,
        "connectivity": sim_type,
        "price_rub": price,
        "availability": av,
        "url": sku_url,
        "images": collect_product_images(soup),
    }


def parse_watch_variant(sku_url: str, model_name: str, sku_slug: str) -> dict[str, Any] | None:
    html = fetch(sku_url)
    time.sleep(SLEEP_SEC)
    soup = BeautifulSoup(html, "html.parser")
    h1 = soup.find("h1")
    if not h1:
        return None
    title = h1.get_text(" ", strip=True)
    text = soup.get_text(" ", strip=True)
    price = parse_price_rub(html, sku_url)
    av = refine_availability(html, text, price, sku_url)
    ch = char_map_from_soup(soup)
    color = ch.get("color", "")
    extra = parse_watch_slug(sku_slug)
    if not color and extra.get("color"):
        color = extra["color"]
    screen = extra.get("screen", "") or (
        f'{ch["diagonal"]}"' if ch.get("diagonal") else ""
    )
    sim_type = extra.get("simType", "")
    if title:
        m = re.search(r"(\d{2})\s*mm", title, re.I)
        if m:
            screen = f"{m.group(1)} mm"
        m2 = re.search(r"\b(S/M|M/L)\b", title, re.I)
        if m2:
            sim_type = m2.group(1).upper()
    return {
        "model": model_name,
        "title": title,
        "color": color,
        "screen": screen,
        "band": sim_type,
        "price_rub": price,
        "availability": av,
        "url": sku_url,
        "images": collect_product_images(soup),
    }


def parse_airpods_variant(model_url: str, model_name: str) -> dict[str, Any] | None:
    """Для AirPods одна страница модели может быть = один SKU или список цветов."""
    html = fetch(model_url)
    time.sleep(SLEEP_SEC)
    soup = BeautifulSoup(html, "html.parser")
    h1 = soup.find("h1")
    if not h1:
        return None
    title = h1.get_text(" ", strip=True)
    text = soup.get_text(" ", strip=True)
    price = parse_price_rub(html, model_url)
    av = refine_availability(html, text, price, model_url)
    ch = char_map_from_soup(soup)
    color = ch.get("color", "") or ""
    if color and ("Характеристики" in color or len(color) > 28):
        color = ""
    t_parts = title.replace("—", "-").split()
    if not color and len(t_parts) >= 2:
        tail = t_parts[-1]
        if tail not in ("USB-C", "3", "4", "active", "Pro"):
            color = tail

    sub: list[str] = []
    parts = path_parts(model_url)
    if len(parts) >= 4:
        # уже страница конкретной комплектации
        pass
    else:
        for a in soup.select("a[href]"):
            href = a.get("href") or ""
            full = urljoin(BASE, href)
            p = path_parts(full)
            if (
                len(p) == 4
                and p[0] == "catalog"
                and p[1] == "airpods"
                and p[2] == parts[2]
            ):
                sub.append(full)

    if sub:
        out: list[dict[str, Any]] = []
        for u in sorted(set(sub)):
            p = path_parts(u)
            one = parse_airpods_variant(u, model_name)
            if one:
                out.append(one)
        return {"_multi": True, "items": out}

    return {
        "model": model_name,
        "title": title,
        "color": color or None,
        "price_rub": price,
        "availability": av,
        "url": model_url,
        "images": collect_product_images(soup),
    }


def iphone_model_included(title: str, min_generation: int = 15) -> bool:
    """Оставляем линейку с iPhone min_generation (15), плюс Air и 17e."""
    tl = title.strip().lower()
    if "iphone air" in tl:
        return True
    if "iphone 17e" in tl or tl.startswith("iphone 17e"):
        return True
    m = re.search(r"iphone\s+(\d+)\b", tl)
    if m:
        return int(m.group(1)) >= min_generation
    return False


def parse_iphone_h1_memory_color(title: str, model_name: str) -> tuple[str, str]:
    """После названия модели: «256GB Deep Blue» или «128GB Pink»."""
    t = title.strip()
    mn = model_name.strip()
    rest = t[len(mn) :].strip() if t.lower().startswith(mn.lower()) else t
    m = re.match(r"^(\d+(?:GB|TB))\s+(.+)$", rest, re.I)
    if m:
        return normalize_storage(m.group(1).replace(" ", "")), m.group(2).strip()
    m2 = re.search(r"(\d+(?:GB|TB))\s+([A-Za-zА-Яа-яёЁ0-9][A-Za-zА-Яа-яёЁ0-9\s\-]+)$", t, re.I)
    if m2:
        return normalize_storage(m2.group(1).replace(" ", "")), m2.group(2).strip()
    return "", ""


def iphone_sim_from_slug(sku_slug: str) -> str:
    """Тип SIM строго из slug SKU на сайте-доноре (текст страницы общий для линеек — не использовать)."""
    sl = sku_slug.lower().replace("-", "_")
    if "nanosim" in sl:
        return "NanoSIM + eSIM"
    if sl.endswith("_esim") or re.search(r"_esim_", sl):
        return "Dual eSIM"
    return "NanoSIM + eSIM"


def parse_iphone_variant(sku_url: str, model_name: str) -> dict[str, Any] | None:
    html = fetch(sku_url)
    time.sleep(SLEEP_SEC)
    soup = BeautifulSoup(html, "html.parser")
    h1 = soup.find("h1")
    if not h1:
        return None
    title = h1.get_text(" ", strip=True)
    text = soup.get_text(" ", strip=True)
    price = parse_price_rub(html, sku_url)
    av = refine_availability(html, text, price, sku_url)
    sku_slug = path_parts(sku_url)[-1]
    memory, color = parse_iphone_h1_memory_color(title, model_name)
    if not color or not memory:
        return None
    sim = iphone_sim_from_slug(sku_slug)
    return {
        "model": model_name,
        "title": title,
        "color": color,
        "memory": memory,
        "sim": sim,
        "price_rub": price,
        "availability": av,
        "url": sku_url,
        "images": collect_product_images(soup),
    }


def parse_macbook_h1(title: str) -> dict[str, str] | None:
    """«MacBook … 13" 8GB 256GB Silver»"""
    m = re.search(
        r'(\d{2})"\s+(\d+)\s*GB\s+(\d+(?:GB|TB))\s+(.+)$',
        title,
        re.I,
    )
    if not m:
        return None
    return {
        "screen": f'{m.group(1)}"',
        "ram": f"{m.group(2)} ГБ",
        "storage": normalize_storage(m.group(3).replace(" ", "")),
        "color": m.group(4).strip(),
    }


def parse_macbook_variant(sku_url: str, model_name: str) -> dict[str, Any] | None:
    html = fetch(sku_url)
    time.sleep(SLEEP_SEC)
    soup = BeautifulSoup(html, "html.parser")
    h1 = soup.find("h1")
    if not h1:
        return None
    title = h1.get_text(" ", strip=True)
    text = soup.get_text(" ", strip=True)
    price = parse_price_rub(html, sku_url)
    av = refine_availability(html, text, price, sku_url)
    parsed = parse_macbook_h1(title)
    if not parsed or not parsed.get("color"):
        return None
    return {
        "model": model_name,
        "title": title,
        "color": parsed["color"],
        "screen": parsed["screen"],
        "ram": parsed["ram"],
        "storage": parsed["storage"],
        "price_rub": price,
        "availability": av,
        "url": sku_url,
        "images": collect_product_images(soup),
    }


def run_iphones(out_dir: Path, min_generation: int = 15) -> None:
    models = discover_models("iphone")
    result: list[dict[str, Any]] = []
    for slug, title in sorted(models.items(), key=lambda x: x[1]):
        if not iphone_model_included(title, min_generation):
            continue
        sku_urls = discover_skus_for_model("iphone", slug)
        variants: list[dict[str, Any]] = []
        for sku_url in sorted(sku_urls):
            v = parse_iphone_variant(sku_url, title)
            if v and v.get("color"):
                variants.append(v)
        if variants:
            result.append({"model": title, "slug": slug, "variants": variants})
        print(f"  iPhone model {title}: {len(variants)} SKU")

    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "iphones.json"
    out_file.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {out_file}")


def run_macbooks(out_dir: Path) -> None:
    models = discover_models("macbook")
    result: list[dict[str, Any]] = []
    for slug, title in sorted(models.items(), key=lambda x: x[1]):
        sku_urls = discover_skus_for_model("macbook", slug)
        if not sku_urls:
            sku_urls = {f"{BASE}/catalog/macbook/{slug}"}
        variants: list[dict[str, Any]] = []
        for sku_url in sorted(sku_urls):
            if len(path_parts(sku_url)) < 4:
                continue
            v = parse_macbook_variant(sku_url, title)
            if v and v.get("color"):
                variants.append(v)
        if variants:
            result.append({"model": title, "slug": slug, "variants": variants})
        print(f"  MacBook model {title}: {len(variants)} SKU")

    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "macbooks.json"
    out_file.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {out_file}")


def run_ipads(out_dir: Path) -> None:
    models = discover_models("ipad")
    result: list[dict[str, Any]] = []
    for slug, title in sorted(models.items(), key=lambda x: x[1]):
        sku_urls = discover_skus_for_model("ipad", slug)
        variants: list[dict[str, Any]] = []
        for sku_url in sorted(sku_urls):
            v = parse_ipad_variant(sku_url, title)
            if v and v.get("color"):
                variants.append(v)
        if variants:
            result.append({"model": title, "slug": slug, "variants": variants})
        print(f"  iPad model {title}: {len(variants)} SKU")

    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "ipads.json"
    out_file.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {out_file}")


def run_watches(out_dir: Path) -> None:
    models = discover_models("watch")
    result: list[dict[str, Any]] = []
    for slug, title in sorted(models.items(), key=lambda x: x[1]):
        sku_urls = discover_skus_for_model("watch", slug)
        if not sku_urls:
            sku_urls = {f"{BASE}/catalog/watch/{slug}"}
        variants: list[dict[str, Any]] = []
        for sku_url in sorted(sku_urls):
            sku_slug = path_parts(sku_url)[-1] if len(path_parts(sku_url)) >= 4 else ""
            v = parse_watch_variant(sku_url, title, sku_slug)
            if v and (v.get("color") or v.get("screen")):
                variants.append(v)
        if variants:
            result.append({"model": title, "slug": slug, "variants": variants})
        print(f"  Watch model {title}: {len(variants)} SKU")

    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "watches.json"
    out_file.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {out_file}")


def run_airpods(out_dir: Path) -> None:
    models = discover_models("airpods")
    result: list[dict[str, Any]] = []
    for slug, title in sorted(models.items(), key=lambda x: x[1]):
        model_url = f"{BASE}/catalog/airpods/{slug}"
        raw = parse_airpods_variant(model_url, title)
        variants: list[dict[str, Any]] = []
        if raw and raw.get("_multi"):
            variants.extend(raw["items"])
        elif raw:
            variants.append(raw)
        if variants:
            result.append({"model": title, "slug": slug, "variants": variants})
        print(f"  AirPods model {title}: {len(variants)} SKU")

    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "airpods.json"
    out_file.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {out_file}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--category",
        choices=["iphone", "macbook", "ipad", "watch", "airpods"],
        help="Ветка каталога",
    )
    ap.add_argument(
        "--all",
        action="store_true",
        help="iphone + macbook + ipad + watch + airpods",
    )
    ap.add_argument(
        "--iphone-min-gen",
        type=int,
        default=15,
        help="Минимальное поколение iPhone (по умолчанию 15; плюс всегда Air и 17e)",
    )
    ap.add_argument(
        "--out-dir",
        type=Path,
        default=Path(__file__).resolve().parent / "output",
    )
    args = ap.parse_args()
    if not args.category and not args.all:
        ap.print_help()
        raise SystemExit(2)
    cats = (
        ["iphone", "macbook", "ipad", "watch", "airpods"]
        if args.all
        else [args.category]
    )
    for c in cats:
        print(f"=== {c} ===")
        if c == "iphone":
            run_iphones(args.out_dir, args.iphone_min_gen)
        elif c == "macbook":
            run_macbooks(args.out_dir)
        elif c == "ipad":
            run_ipads(args.out_dir)
        elif c == "watch":
            run_watches(args.out_dir)
        else:
            run_airpods(args.out_dir)


if __name__ == "__main__":
    main()
