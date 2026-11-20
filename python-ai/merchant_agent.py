#!/usr/bin/env python3
"""
Matgarak Merchant AI Copilot — Python Engine (Groq Streaming + Smart Store Control)

Reads a single JSON payload from stdin:
{
  "messages": [{ "role": "user" | "assistant", "content": "..." }],
  "storeContext": { ... },
  "locale": "ar" | "en"
}

Streams NDJSON events to stdout:
  {"type": "meta", "engine": "groq" | "python-local", "model": "..."}
  {"type": "token", "delta": "..."}
  {"type": "action", "action": { "type": "...", "payload": { ... } }}
  {"type": "done"}
"""

import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional, Tuple


GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")


def emit(event: Dict[str, Any]) -> None:
    try:
        sys.stdout.write(json.dumps(event, ensure_ascii=False) + "\n")
        sys.stdout.flush()
    except BrokenPipeError:
        sys.exit(0)


def is_arabic_text(text: str) -> bool:
    return bool(re.search(r"[\u0600-\u06FF]", text or ""))


def build_system_prompt(store_context: Dict[str, Any], lang: str) -> str:
    store = store_context.get("store", {})
    metrics = store_context.get("metrics", {})
    products = store_context.get("products", [])
    categories = store_context.get("categories", [])
    orders = store_context.get("orders", [])
    discounts = store_context.get("discounts", [])
    shipping = store_context.get("shippingMethods", [])

    compact_snapshot = {
        "store": {
            "nameAr": store.get("nameAr"),
            "nameEn": store.get("nameEn"),
            "slug": store.get("slug"),
            "url": f"/s/{store.get('slug', '')}",
            "status": store.get("status"),
            "currency": store.get("currency", "EGP"),
            "theme": store.get("theme", {}),
            "paymentConfig": store.get("paymentConfig", {}),
        },
        "metrics": metrics,
        "categories": [
            {"id": c.get("id"), "nameAr": c.get("nameAr"), "nameEn": c.get("nameEn")}
            for c in categories[:15]
        ],
        "products": [
            {
                "id": p.get("id"),
                "nameAr": p.get("nameAr"),
                "nameEn": p.get("nameEn"),
                "price": p.get("price"),
                "totalStock": p.get("totalStock"),
                "lowStockThreshold": p.get("lowStockThreshold"),
                "salesCount": p.get("salesCount"),
                "variants": [
                    {
                        "id": v.get("id"),
                        "size": v.get("size"),
                        "color": v.get("color"),
                        "stock": v.get("stock"),
                    }
                    for v in p.get("variants", [])[:8]
                ],
            }
            for p in products[:25]
        ],
        "orders": [
            {
                "id": o.get("id"),
                "orderNumber": o.get("orderNumber"),
                "customerName": o.get("customerName"),
                "city": o.get("city"),
                "status": o.get("status"),
                "total": o.get("total"),
                "itemsCount": o.get("itemsCount"),
            }
            for o in orders[:20]
        ],
        "discounts": [
            {
                "id": d.get("id"),
                "code": d.get("code"),
                "type": d.get("type"),
                "value": d.get("value"),
                "active": d.get("active"),
                "usedCount": d.get("usedCount"),
            }
            for d in discounts[:15]
        ],
        "shippingMethods": [
            {
                "id": s.get("id"),
                "nameAr": s.get("nameAr"),
                "nameEn": s.get("nameEn"),
                "rate": s.get("rate"),
                "freeAbove": s.get("freeAbove"),
                "enabled": s.get("enabled"),
            }
            for s in shipping[:5]
        ],
    }

    lang_instruction = (
        "Respond naturally in clear, helpful Arabic (matching the merchant's tone)."
        if lang == "ar"
        else "Respond naturally in clear, executive English."
    )

    return f"""You are the dedicated AI Store Copilot for a clothing & fashion brand on Matgarak.
{lang_instruction}
Always match the language of the merchant's latest message (Arabic or English).

You have FULL real-time visibility into the store's live data AND full authority to execute real store actions when the merchant asks you to create, edit, publish, or manage anything.

LIVE STORE SNAPSHOT (JSON):
{json.dumps(compact_snapshot, ensure_ascii=False)}

EXECUTABLE STORE ACTIONS PROTOCOL:
Whenever the merchant asks you to perform a change in their store (add product, edit price, update stock, create/toggle coupon, update order status, publish/draft store, change theme colors/preset, update shipping rate, create category), you MUST include one or more action blocks at the end of your response using this EXACT single-line format:
[[ACTION:{{"type":"<action_type>","payload":{{...}}}}]]

Supported action types and exact payload schemas:
1. create_product:
   {{"nameAr":"...","nameEn":"...","price":1200,"stock":20,"sizes":["M","L","XL"],"color":"Black","colorHex":"#111111","categoryId":"optional_id","visualType":"hoodie|coat|tshirt|trousers|dress|bag|sneakers"}}
2. update_product_price:
   {{"productId":"exact_id_from_snapshot","price":1100}}
3. adjust_variant_stock:
   {{"productId":"exact_id","variantId":"exact_variant_id","delta":10,"note":"Restocked via AI Copilot"}}
4. create_discount:
   {{"code":"VIP20","type":"percentage|fixed|free_shipping","value":20,"minOrderValue":0}}
5. toggle_discount:
   {{"discountId":"exact_id","active":true}}
6. update_order_status:
   {{"orderId":"exact_id","status":"pending|confirmed|processing|shipped|delivered|cancelled","note":"Updated via AI Copilot"}}
7. update_store_status:
   {{"status":"published|draft"}}
8. update_theme:
   {{"primaryColor":"#1E293B","accentColor":"#C9965E","presetId":"minimal-fashion|modern-cosmetics|electronics-pro","publish":true}}
9. update_shipping:
   {{"rate":60,"freeAbove":1500}}
10. create_category:
   {{"nameAr":"...","nameEn":"...","descriptionAr":"...","descriptionEn":"..."}}

RULES:
- Never fabricate store numbers; always cite exact figures from LIVE STORE SNAPSHOT.
- Format responses cleanly using concise Markdown (bullet lists, bold figures, clean headings).
- Only emit [[ACTION:...]] blocks when the user asks to perform an action, and NEVER mention the raw [[ACTION:...]] syntax in your prose explanation.
- Confirm clearly what you executed in friendly language."""


class ActionBlockStreamFilter:
    """
    Streams plain assistant text smoothly while intercepting [[ACTION:{...}]]
    markers so raw JSON never flashes in the UI.
    """

    START_MARKER = "[[ACTION:"
    END_MARKER = "]]"

    def __init__(self) -> None:
        self.buffer = ""
        self.in_action = False
        self.actions: List[Dict[str, Any]] = []

    def feed(self, chunk: str) -> None:
        self.buffer += chunk
        while True:
            if not self.in_action:
                idx = self.buffer.find(self.START_MARKER)
                if idx != -1:
                    if idx > 0:
                        emit({"type": "token", "delta": self.buffer[:idx]})
                    self.buffer = self.buffer[idx + len(self.START_MARKER) :]
                    self.in_action = True
                    continue
                # Hold back possible partial start marker at the tail
                keep = len(self.START_MARKER) - 1
                if len(self.buffer) > keep:
                    emit({"type": "token", "delta": self.buffer[:-keep]})
                    self.buffer = self.buffer[-keep:]
                break
            else:
                end_idx = self.buffer.find(self.END_MARKER)
                if end_idx != -1:
                    raw_json = self.buffer[:end_idx].strip()
                    self.buffer = self.buffer[end_idx + len(self.END_MARKER) :]
                    self.in_action = False
                    try:
                        parsed = json.loads(raw_json)
                        if isinstance(parsed, dict) and "type" in parsed:
                            self.actions.append(parsed)
                            emit({"type": "action", "action": parsed})
                    except json.JSONDecodeError:
                        pass
                    continue
                break

    def flush(self) -> None:
        if not self.in_action and self.buffer:
            emit({"type": "token", "delta": self.buffer})
        self.buffer = ""


def stream_from_groq(
    api_key: str,
    messages: List[Dict[str, str]],
    store_context: Dict[str, Any],
    lang: str,
) -> bool:
    system_prompt = build_system_prompt(store_context, lang)
    groq_messages = [{"role": "system", "content": system_prompt}]
    for msg in messages[-12:]:
        role = msg.get("role")
        content = str(msg.get("content", "")).strip()
        if role in ("user", "assistant") and content:
            groq_messages.append({"role": role, "content": content[:4000]})

    body = json.dumps(
        {
            "model": DEFAULT_GROQ_MODEL,
            "messages": groq_messages,
            "temperature": 0.3,
            "max_tokens": 1200,
            "stream": True,
        }
    ).encode("utf-8")

    req = urllib.request.Request(
        GROQ_ENDPOINT,
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
            "User-Agent": "Matgarak-Python-Copilot/1.0",
        },
        method="POST",
    )

    emit({"type": "meta", "engine": "groq", "model": DEFAULT_GROQ_MODEL})
    stream_filter = ActionBlockStreamFilter()

    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            for raw_line in resp:
                line = raw_line.decode("utf-8", errors="ignore").strip()
                if not line or not line.startswith("data:"):
                    continue
                data_str = line[5:].strip()
                if data_str == "[DONE]":
                    break
                try:
                    payload = json.loads(data_str)
                    choices = payload.get("choices") or []
                    if not choices:
                        continue
                    delta = choices[0].get("delta", {}).get("content")
                    if delta:
                        stream_filter.feed(delta)
                except json.JSONDecodeError:
                    continue
        stream_filter.flush()
        return True
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as exc:
        err_msg = str(exc)
        fallback_note = (
            f"\n\n> ⚠️ تعذر الوصول إلى Groq API مؤقتاً ({err_msg})، لذلك نفّذ محرك بايثون الذكي طلبك محلياً.\n\n"
            if lang == "ar"
            else f"\n\n> ⚠️ Groq API was temporarily unreachable ({err_msg}), so the Python engine handled your request locally.\n\n"
        )
        emit({"type": "token", "delta": fallback_note})
        return False


def stream_text_smoothly(text: str) -> None:
    tokens = re.findall(r"\S+\s*|\n+", text)
    chunk_buf = ""
    for i, tok in enumerate(tokens):
        chunk_buf += tok
        if len(chunk_buf) >= 10 or "\n" in tok or i == len(tokens) - 1:
            emit({"type": "token", "delta": chunk_buf})
            chunk_buf = ""
            time.sleep(0.018)


def run_python_smart_copilot(
    user_message: str, store_context: Dict[str, Any], lang: str
) -> None:
    emit({"type": "meta", "engine": "python-local", "model": "python-store-copilot-v1"})

    store = store_context.get("store", {})
    metrics = store_context.get("metrics", {})
    products = store_context.get("products", [])
    orders = store_context.get("orders", [])
    discounts = store_context.get("discounts", [])
    shipping = store_context.get("shippingMethods", [])

    currency = store.get("currency", "EGP")
    store_name = store.get("nameAr") if lang == "ar" else store.get("nameEn")
    slug = store.get("slug", "menz-club")
    text = user_message.strip()
    lower = text.lower()

    actions: List[Dict[str, Any]] = []
    reply = ""

    # 1. Create Discount / Coupon
    if any(k in lower for k in ["كود خصم", "كوبون", "خصم", "coupon", "discount", "promo"]):
        code_match = re.search(r"\b([A-Za-z][A-Za-z0-9]{2,15})\b", text)
        excluded = {"create", "discount", "coupon", "promo", "code", "off", "for", "free", "shipping", "add", "new", "store", "percent"}
        code = None
        for m in re.finditer(r"\b([A-Za-z][A-Za-z0-9]{2,15})\b", text):
            cand = m.group(1)
            if cand.lower() not in excluded:
                code = cand.upper()
                break
        if not code:
            code = "CLUB20"

        is_free_ship = any(k in lower for k in ["شحن مجاني", "free ship", "freeship"])
        num_match = re.search(r"(\d+(?:\.\d+)?)", text)
        val = float(num_match.group(1)) if num_match else 15.0
        is_fixed = any(k in lower for k in ["جنيه", "ج.م", "egp", "fixed", "مبلغ"]) and "%" not in text and "نسبة" not in lower and "بنسبة" not in lower

        disc_type = "free_shipping" if is_free_ship else ("fixed" if is_fixed else "percentage")
        if disc_type == "percentage" and val > 90:
            val = 20.0

        actions.append(
            {
                "type": "create_discount",
                "payload": {
                    "code": code,
                    "type": disc_type,
                    "value": 0 if disc_type == "free_shipping" else val,
                    "minOrderValue": 0,
                },
            }
        )
        if lang == "ar":
            desc = (
                "شحن مجاني للطلبات"
                if disc_type == "free_shipping"
                else (f"خصم ثابت بقيمة **{int(val)} {currency}**" if disc_type == "fixed" else f"خصم بنسبة **{int(val)}%**")
            )
            reply = (
                f"تم إنشاء وتفعيل كود الخصم الجديد لمتجر **{store_name}** بنجاح:\n\n"
                f"- **الكود:** `{code}`\n"
                f"- **القيمة:** {desc}\n"
                f"- **الحالة:** مفعّل وجاهز للاستخدام فوراً في سلة المشتريات\n\n"
                f"يمكنك مشاركة الكود مع عملائك على إنستجرام وواتساب الآن."
            )
        else:
            desc = (
                "Free shipping"
                if disc_type == "free_shipping"
                else (f"**{int(val)} {currency} fixed off**" if disc_type == "fixed" else f"**{int(val)}% off**")
            )
            reply = (
                f"I've created and activated your new promo code for **{store_name}**:\n\n"
                f"- **Code:** `{code}`\n"
                f"- **Discount:** {desc}\n"
                f"- **Status:** Active immediately at checkout\n\n"
                f"Customers can apply `{code}` right away on `/s/{slug}`."
            )

    # 2. Add New Clothing Product
    elif any(k in lower for k in ["أضف منتج", "اضف منتج", "منتج جديد", "اضافة منتج", "add product", "create product", "new product"]):
        price_match = re.search(r"(?:بسعر|سعر|price|at)\s*(\d{2,6})", lower)
        if not price_match:
            nums = re.findall(r"\b(\d{3,5})\b", text)
            price = int(nums[0]) if nums else 1450
        else:
            price = int(price_match.group(1))

        # Extract product name cleanly
        name_clean = re.sub(
            r"(?:أضف منتج جديد|اضف منتج جديد|أضف منتج|اضف منتج|منتج جديد|add product|create product|new product)\s*:?",
            "",
            text,
            flags=re.IGNORECASE,
        ).strip()
        name_clean = re.split(r"(?:بسعر|سعر|ومقاسات|مقاسات|price|at\s+\d|sizes)", name_clean, maxsplit=1, flags=re.IGNORECASE)[0].strip(" -–:،,")
        if not name_clean or len(name_clean) < 2:
            name_ar = "بليزر كتان بيج فاخر"
            name_en = "Tailored Beige Linen Blazer"
        elif is_arabic_text(name_clean):
            name_ar = name_clean
            name_en = name_clean
        else:
            name_en = name_clean
            name_ar = name_clean

        visual = "coat"
        if any(k in lower for k in ["هودي", "سويت", "hoodie"]):
            visual = "hoodie"
        elif any(k in lower for k in ["تيشيرت", "قميص", "shirt", "tee", "polo"]):
            visual = "tshirt"
        elif any(k in lower for k in ["بنطلون", "جينز", "trouser", "pant", "jeans"]):
            visual = "trousers"
        elif any(k in lower for k in ["فستان", "عباية", "dress", "abaya"]):
            visual = "dress"
        elif any(k in lower for k in ["شنطة", "حقيبة", "bag", "tote"]):
            visual = "bag"
        elif any(k in lower for k in ["حذاء", "سنيكر", "shoe", "sneaker"]):
            visual = "sneakers"

        sizes_found = re.findall(r"\b(XS|S|M|L|XL|XXL)\b", text.upper())
        sizes = list(dict.fromkeys(sizes_found)) if sizes_found else ["M", "L", "XL"]

        actions.append(
            {
                "type": "create_product",
                "payload": {
                    "nameAr": name_ar,
                    "nameEn": name_en,
                    "price": price,
                    "stock": 15,
                    "sizes": sizes,
                    "color": "Classic",
                    "colorHex": "#1C1917",
                    "visualType": visual,
                },
            }
        )
        if lang == "ar":
            reply = (
                f"تمت إضافة قطعة الملابس الجديدة إلى كتالوج **{store_name}** ونشرها فوراً:\n\n"
                f"- **اسم المنتج:** {name_ar}\n"
                f"- **السعر:** {price:,} {currency}\n"
                f"- **المقاسات المتاحة:** {', '.join(sizes)} (15 قطعة لكل مقاس)\n"
                f"- **الحالة:** نشط ويظهر الآن للعملاء في المتجر"
            )
        else:
            reply = (
                f"I've added and published your new garment to **{store_name}**:\n\n"
                f"- **Product:** {name_en}\n"
                f"- **Price:** {price:,} {currency}\n"
                f"- **Sizes:** {', '.join(sizes)} (15 units per size)\n"
                f"- **Status:** Active & live on `/s/{slug}`"
            )

    # 3. Update Order Status
    elif any(k in lower for k in ["أكد", "تأكيد", "شحن الطلب", "تم التسليم", "الغي الطلب", "حالة الطلب", "confirm", "ship order", "deliver", "cancel order", "pending order"]):
        target_status = "confirmed"
        if any(k in lower for k in ["شحن", "ship"]):
            target_status = "shipped"
        elif any(k in lower for k in ["تسليم", "deliver"]):
            target_status = "delivered"
        elif any(k in lower for k in ["تجهيز", "process"]):
            target_status = "processing"
        elif any(k in lower for k in ["الغ", "إلغ", "cancel"]):
            target_status = "cancelled"

        target_order = None
        for o in orders:
            ord_num = str(o.get("orderNumber", "")).lower()
            if ord_num and ord_num in lower:
                target_order = o
                break
        if not target_order:
            pending_orders = [o for o in orders if o.get("status") == "pending"]
            target_order = pending_orders[0] if pending_orders else (orders[0] if orders else None)

        if target_order:
            actions.append(
                {
                    "type": "update_order_status",
                    "payload": {
                        "orderId": target_order.get("id"),
                        "status": target_status,
                        "note": "Updated by AI Store Copilot",
                    },
                }
            )
            status_ar = {
                "confirmed": "مؤكد",
                "processing": "قيد التجهيز",
                "shipped": "تم الشحن",
                "delivered": "تم التسليم",
                "cancelled": "ملغى",
            }.get(target_status, target_status)
            if lang == "ar":
                reply = (
                    f"تم تحديث حالة الطلب بنجاح:\n\n"
                    f"- **رقم الطلب:** `#{target_order.get('orderNumber')}`\n"
                    f"- **العميل:** {target_order.get('customerName')}\n"
                    f"- **الحالة الجديدة:** **{status_ar}**\n"
                    f"- **الإجمالي:** {target_order.get('total', 0):,} {currency}"
                )
            else:
                reply = (
                    f"Order status updated successfully:\n\n"
                    f"- **Order:** `#{target_order.get('orderNumber')}`\n"
                    f"- **Customer:** {target_order.get('customerName')}\n"
                    f"- **New Status:** **{target_status.title()}**\n"
                    f"- **Total:** {target_order.get('total', 0):,} {currency}"
                )
        else:
            reply = (
                "لا توجد طلبات حالياً في المتجر لتحديث حالتها."
                if lang == "ar"
                else "There are no orders in your store to update yet."
            )

    # 4. Change Theme Color / Design
    elif any(k in lower for k in ["لون", "الألوان", "ثيم", "قالب", "تصميم", "color", "theme", "design"]):
        hex_match = re.search(r"#[0-9A-Fa-f]{6}\b", text)
        color_map = {
            "كحلي": "#1E293B",
            "أزرق": "#1E3A8A",
            "navy": "#1E293B",
            "زيتي": "#2F3E2E",
            "أخضر": "#14532D",
            "olive": "#2F3E2E",
            "خمري": "#5B1E28",
            "عنابي": "#5B1E28",
            "burgundy": "#5B1E28",
            "أسود": "#111111",
            "black": "#111111",
            "برونزي": "#8C5225",
            "بني": "#4A2C2A",
            "bronze": "#8C5225",
        }
        chosen_hex = hex_match.group(0).upper() if hex_match else "#1E293B"
        if not hex_match:
            for kw, hx in color_map.items():
                if kw in lower:
                    chosen_hex = hx
                    break

        actions.append(
            {
                "type": "update_theme",
                "payload": {
                    "primaryColor": chosen_hex,
                    "publish": True,
                },
            }
        )
        if lang == "ar":
            reply = (
                f"تم تحديث اللون الأساسي لمتجر **{store_name}** ونشر التعديل مباشرة على الواجهة:\n\n"
                f"- **اللون الأساسي الجديد:** `{chosen_hex}`\n"
                f"- **المعاينة الحية:** افتح `/s/{slug}` لمشاهدة التصميم المحدّث فوراً."
            )
        else:
            reply = (
                f"I've updated and published your storefront primary color for **{store_name}**:\n\n"
                f"- **New Primary Color:** `{chosen_hex}`\n"
                f"- **Live Storefront:** Visit `/s/{slug}` to see it live immediately."
            )

    # 5. Update Store Publish / Draft Status
    elif any(k in lower for k in ["مسودة", "إيقاف المتجر", "اخفاء المتجر", "نشر المتجر", "publish store", "draft mode", "unpublish"]):
        target_st = "draft" if any(k in lower for k in ["مسودة", "إيقاف", "اخفاء", "draft", "unpublish"]) else "published"
        actions.append({"type": "update_store_status", "payload": {"status": target_st}})
        if lang == "ar":
            reply = (
                f"تم تحويل حالة متجر **{store_name}** إلى **{'منشور ومتاح للعملاء' if target_st == 'published' else 'وضع المسودة'}** بنجاح."
            )
        else:
            reply = (
                f"Store **{store_name}** status has been switched to **{target_st.upper()}**."
            )

    # 6. Update Shipping Rate
    elif any(k in lower for k in ["سعر الشحن", "مصاريف الشحن", "تعديل الشحن", "shipping rate", "shipping fee"]):
        nums = [int(n) for n in re.findall(r"\b(\d{1,5})\b", text)]
        rate = nums[0] if nums else 50
        free_above = nums[1] if len(nums) > 1 else 1500
        actions.append({"type": "update_shipping", "payload": {"rate": rate, "freeAbove": free_above}})
        if lang == "ar":
            reply = (
                f"تم تحديث إعدادات الشحن لمتجر **{store_name}**:\n\n"
                f"- **سعر الشحن الأساسي:** {rate} {currency}\n"
                f"- **شحن مجاني للطلبات فوق:** {free_above:,} {currency}"
            )
        else:
            reply = (
                f"Updated shipping settings for **{store_name}**:\n\n"
                f"- **Base Shipping Rate:** {rate} {currency}\n"
                f"- **Free Shipping Above:** {free_above:,} {currency}"
            )

    # 7. Sales, Inventory & Low-Stock Intelligence Report (Default & Summary queries)
    else:
        total_sales = metrics.get("totalSales", 0)
        total_orders = metrics.get("totalOrders", 0)
        pending_count = metrics.get("pendingCount", 0)
        completed_count = metrics.get("completedCount", 0)
        avg_order = metrics.get("averageOrderValue", 0)

        low_stock = [
            p for p in products
            if int(p.get("totalStock", 0)) <= int(p.get("lowStockThreshold", 5))
        ]
        top_products = sorted(products, key=lambda x: x.get("salesCount", 0), reverse=True)[:3]
        active_coupons = [d.get("code") for d in discounts if d.get("active")]

        if lang == "ar":
            low_lines = (
                "\n".join(
                    f"  - **{p.get('nameAr')}** — المتبقي `{p.get('totalStock')}` قطعة فقط"
                    for p in low_stock
                )
                if low_stock
                else "  - جميع القطع والمقاسات متوفرة بمخزون آمن."
            )
            top_lines = "\n".join(
                f"  - **{p.get('nameAr')}** ({p.get('salesCount', 0)} مبيعة · {p.get('price', 0):,} {currency})"
                for p in top_products
            )
            coupons_str = "، ".join(f"`{c}`" for c in active_coupons) if active_coupons else "لا توجد أكواد مفعّلة"
            reply = (
                f"### ملخص متجر **{store_name}** المباشر\n\n"
                f"- **رابط المتجر:** `/s/{slug}`\n"
                f"- **إجمالي المبيعات:** **{total_sales:,} {currency}** (متوسط الطلب: {avg_order:,} {currency})\n"
                f"- **الطلبات:** {total_orders} إجمالي ({pending_count} قيد الانتظار · {completed_count} مكتمل)\n"
                f"- **عدد المنتجات:** {len(products)} قطعة ملابس\n"
                f"- **أكواد الخصم الفعّالة:** {coupons_str}\n\n"
                f"**تنبيهات المخزون المنخفض:**\n{low_lines}\n\n"
                f"**الأكثر مبيعاً:**\n{top_lines}\n\n"
                f"يمكنك أن تطلب مني تنفيذ أي إجراء مباشرة، مثل:\n"
                f"- *\"اعمل كود خصم VIP20 بنسبة 20%\"*\n"
                f"- *\"أضف منتج جديد: بليزر كتان بيج بسعر 1650 ومقاسات M, L, XL\"*\n"
                f"- *\"أكد أحدث طلب قيد الانتظار\"*\n"
                f"- *\"غيّر لون المتجر إلى كحلي #1E293B\"*"
            )
        else:
            low_lines = (
                "\n".join(
                    f"  - **{p.get('nameEn')}** — only `{p.get('totalStock')}` left"
                    for p in low_stock
                )
                if low_stock
                else "  - All apparel sizes and variants have healthy stock."
            )
            top_lines = "\n".join(
                f"  - **{p.get('nameEn')}** ({p.get('salesCount', 0)} sold · {p.get('price', 0):,} {currency})"
                for p in top_products
            )
            coupons_str = ", ".join(f"`{c}`" for c in active_coupons) if active_coupons else "None active"
            reply = (
                f"### Live Executive Summary — **{store_name}**\n\n"
                f"- **Storefront URL:** `/s/{slug}`\n"
                f"- **Total Revenue:** **{total_sales:,} {currency}** (Avg. order: {avg_order:,} {currency})\n"
                f"- **Orders:** {total_orders} total ({pending_count} pending · {completed_count} delivered)\n"
                f"- **Active Catalog:** {len(products)} clothing items\n"
                f"- **Active Promo Codes:** {coupons_str}\n\n"
                f"**Low-Stock Alerts:**\n{low_lines}\n\n"
                f"**Top Sellers:**\n{top_lines}\n\n"
                f"Ask me to execute any store action directly — for example:\n"
                f"- *\"Create 20% promo code VIP20\"*\n"
                f"- *\"Add product Beige Linen Blazer price 1650 sizes M, L, XL\"*\n"
                f"- *\"Confirm the latest pending order\"*\n"
                f"- *\"Change store theme color to Navy #1E293B\"*"
            )

    stream_text_smoothly(reply)
    for act in actions:
        emit({"type": "action", "action": act})


def main() -> None:
    try:
        raw_input = sys.stdin.read()
        data = json.loads(raw_input) if raw_input.strip() else {}
    except json.JSONDecodeError:
        emit({"type": "error", "message": "Invalid JSON input payload"})
        emit({"type": "done"})
        return

    messages = data.get("messages") or []
    store_context = data.get("storeContext") or {}
    fallback_locale = "en" if data.get("locale") == "en" else "ar"

    last_user_msg = ""
    for m in reversed(messages):
        if m.get("role") == "user":
            last_user_msg = str(m.get("content", ""))
            break

    # Match the customer's exact language automatically
    lang = "ar" if is_arabic_text(last_user_msg) else ("en" if last_user_msg.strip() else fallback_locale)

    groq_api_key = os.environ.get("GROQ_API_KEY", "").strip()
    if groq_api_key and not groq_api_key.startswith("YOUR_"):
        ok = stream_from_groq(groq_api_key, messages, store_context, lang)
        if not ok:
            run_python_smart_copilot(last_user_msg, store_context, lang)
    else:
        run_python_smart_copilot(last_user_msg, store_context, lang)

    emit({"type": "done"})


if __name__ == "__main__":
    main()
