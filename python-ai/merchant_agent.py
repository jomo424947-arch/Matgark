#!/usr/bin/env python3
"""
Matgarak Merchant AI Copilot — Python Engine (Groq Streaming + Persistent Supabase Memory + Live DB Control)

Reads a single JSON payload from stdin:
{
  "messages": [{ "role": "user" | "assistant", "content": "..." }],
  "storeContext": { ... },
  "memories": [{ "memoryKey": "...", "memoryValue": "...", "category": "..." }],
  "recentChats": [{ "title": "...", "lastMessages": ["..."] }],
  "storeUrl": "http://187.126.0.23:3002/s/menz-club",
  "locale": "ar" | "en"
}

Streams NDJSON events to stdout:
  {"type": "meta", "engine": "groq" | "python-local", "model": "..."}
  {"type": "token", "delta": "..."}
  {"type": "action", "action": { "type": "...", "payload": { ... } }}
  {"type": "memory", "memory": { "key": "...", "value": "...", "category": "...", "importance": 4 }}
  {"type": "done"}
"""

import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from typing import Any, Dict, List


GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_GROQ_MODEL = os.environ.get("GROQ_MODEL", "qwen/qwen3.8-27b").strip() or "qwen/qwen3.8-27b"
GROQ_FALLBACK_MODELS = [
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "llama-3.3-70b-versatile",
]


def emit(event: Dict[str, Any]) -> None:
    try:
        sys.stdout.write(json.dumps(event, ensure_ascii=False) + "\n")
        sys.stdout.flush()
    except BrokenPipeError:
        sys.exit(0)


def is_arabic_text(text: str) -> bool:
    return bool(re.search(r"[\u0600-\u06FF]", text or ""))


def build_system_prompt(
    store_context: Dict[str, Any],
    memories: List[Dict[str, Any]],
    recent_chats: List[Dict[str, Any]],
    store_url: str,
    lang: str,
) -> str:
    store = store_context.get("store", {})
    database = store_context.get("database", {})
    metrics = store_context.get("metrics", {})
    products = store_context.get("products", [])
    categories = store_context.get("categories", [])
    orders = store_context.get("orders", [])
    customers = store_context.get("customers", [])
    discounts = store_context.get("discounts", [])
    shipping = store_context.get("shippingMethods", [])

    slug = store.get("slug", "")
    resolved_url = store_url or f"/s/{slug}"

    compact_snapshot = {
        "database": database,
        "store": {
            "id": store.get("id"),
            "nameAr": store.get("nameAr"),
            "nameEn": store.get("nameEn"),
            "slug": slug,
            "liveUrl": resolved_url,
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
                "customerPhone": o.get("customerPhone"),
                "city": o.get("city"),
                "status": o.get("status"),
                "statusAr": o.get("statusAr"),
                "total": o.get("total"),
                "itemsCount": o.get("itemsCount"),
            }
            for o in orders[:20]
        ],
        "customers": [
            {
                "name": cu.get("name"),
                "phone": cu.get("phone"),
                "city": cu.get("city"),
                "totalOrders": cu.get("totalOrders"),
                "totalSpent": cu.get("totalSpent"),
                "tag": cu.get("tag"),
            }
            for cu in customers[:20]
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

    memory_lines = [
        f"- [{m.get('category', 'general')}] {m.get('memoryKey')}: {m.get('memoryValue')}"
        for m in memories[:30]
        if m.get("memoryValue")
    ]
    memory_block = "\n".join(memory_lines) if memory_lines else "No saved long-term memories yet."

    recent_chat_lines = []
    for rc in recent_chats[:5]:
        title = rc.get("title", "Previous Chat")
        snippets = " | ".join(rc.get("lastMessages", [])[:3])
        if snippets:
            recent_chat_lines.append(f"- Chat '{title}': {snippets}")
    recent_chats_block = (
        "\n".join(recent_chat_lines)
        if recent_chat_lines
        else "No earlier conversations recorded."
    )

    lang_instruction = (
        "Respond naturally in clear, helpful Arabic (matching the merchant's tone)."
        if lang == "ar"
        else "Respond naturally in clear, executive English."
    )

    return f"""You are the dedicated AI Store Copilot for a clothing & fashion store on Matgarak, connected directly to the merchant's live Supabase PostgreSQL database with persistent cross-chat memory.
{lang_instruction}
Always match the language of the merchant's latest message (Arabic or English).

LIVE STORE DATABASE SNAPSHOT (JSON — STRICTLY THIS MERCHANT'S STORE):
{json.dumps(compact_snapshot, ensure_ascii=False)}

LONG-TERM STORE MEMORY (PERSISTED IN SUPABASE ACROSS ALL CHATS):
{memory_block}

RECENT EARLIER CONVERSATIONS (CROSS-CHAT CONTEXT):
{recent_chats_block}

EXECUTABLE STORE ACTIONS PROTOCOL:
Whenever the merchant asks to change anything in their store (add product, update price, update stock, create/toggle coupon, update order status, publish/draft store, change theme colors/preset, update shipping rate, create category), you MUST append one or more action blocks at the VERY END of your response on separate lines using this EXACT format:
[[ACTION:{{"type":"<action_type>","payload":{{...}}}}]]

Supported action types:
1. create_product: {{"nameAr":"...","nameEn":"...","price":1200,"stock":20,"sizes":["M","L","XL"],"color":"Black","colorHex":"#111111","visualType":"hoodie|coat|tshirt|trousers|dress|bag|sneakers"}}
2. update_product_price: {{"productId":"exact_id_from_snapshot","price":1100}}
3. adjust_variant_stock: {{"productId":"exact_id","variantId":"exact_variant_id","delta":10,"note":"Restocked via AI Copilot"}}
4. create_discount: {{"code":"VIP20","type":"percentage|fixed|free_shipping","value":20,"minOrderValue":0}}
5. toggle_discount: {{"discountId":"exact_id","active":true}}
6. update_order_status: {{"orderId":"exact_id","status":"pending|confirmed|processing|shipped|delivered|cancelled","note":"Updated via AI Copilot"}}
7. update_store_status: {{"status":"published|draft"}}
8. update_theme: {{"primaryColor":"#1E293B","accentColor":"#C9965E","presetId":"minimal-fashion|modern-cosmetics|electronics-pro","publish":true}}
9. update_shipping: {{"rate":60,"freeAbove":1500}}
10. create_category: {{"nameAr":"...","nameEn":"...","descriptionAr":"...","descriptionEn":"..."}}

PERSISTENT LONG-TERM MEMORY PROTOCOL (CRITICAL!):
Whenever the merchant shares a lasting preference, store rule, goal, pricing target, brand voice, supplier detail, VIP policy, or explicitly says "افتكر / تذكر / احفظ / remember / keep in mind", you MUST append a memory block at the VERY END of your response using this EXACT single-line format:
[[MEMORY:{{"key":"short_snake_case_key","value":"concise fact to remember across all future chats","category":"preference|business|inventory|pricing|customer|general","importance":4}}]]

STRICT RULES:
- Use exact real figures, product names, order numbers, customer names, and live URL ({resolved_url}) from LIVE STORE DATABASE SNAPSHOT. Never fabricate database rows.
- Reference LONG-TERM STORE MEMORY and RECENT EARLIER CONVERSATIONS seamlessly when relevant, so the merchant feels you truly remember them across chats!
- Format responses cleanly using concise Markdown.
- NEVER reveal or mention the raw [[ACTION:...]] or [[MEMORY:...]] syntax in your visible text.
- NEVER output <think> reasoning tags."""


class SmartTagStreamFilter:
    """
    Streams clean assistant prose while transparently stripping and emitting:
      - [[ACTION:{...}]]
      - [[MEMORY:{...}]]
      - <think>...</think>
    """

    MARKERS = ("[[ACTION:", "[[MEMORY:", "<think>")

    def __init__(self) -> None:
        self.buffer = ""
        self.mode = "text"  # "text" | "action" | "memory" | "think"
        self.emitted_chars = 0

    def _emit_token(self, text: str) -> None:
        if text:
            self.emitted_chars += len(text)
            emit({"type": "token", "delta": text})

    def feed(self, chunk: str) -> None:
        self.buffer += chunk
        while True:
            if self.mode == "text":
                earliest_idx = -1
                earliest_marker = ""
                for m in self.MARKERS:
                    idx = self.buffer.find(m)
                    if idx != -1 and (earliest_idx == -1 or idx < earliest_idx):
                        earliest_idx = idx
                        earliest_marker = m

                if earliest_idx != -1:
                    if earliest_idx > 0:
                        self._emit_token(self.buffer[:earliest_idx])
                    self.buffer = self.buffer[earliest_idx + len(earliest_marker) :]
                    if earliest_marker == "[[ACTION:":
                        self.mode = "action"
                    elif earliest_marker == "[[MEMORY:":
                        self.mode = "memory"
                    else:
                        self.mode = "think"
                    continue

                # Hold back possible partial prefix of any marker
                keep = max(len(m) for m in self.MARKERS) - 1
                if len(self.buffer) > keep:
                    self._emit_token(self.buffer[:-keep])
                    self.buffer = self.buffer[-keep:]
                break

            elif self.mode == "think":
                end_idx = self.buffer.find("</think>")
                if end_idx != -1:
                    self.buffer = self.buffer[end_idx + len("</think>") :].lstrip("\n")
                    self.mode = "text"
                    continue
                break

            else:
                end_idx = self.buffer.find("]]")
                if end_idx != -1:
                    raw_json = self.buffer[:end_idx].strip()
                    self.buffer = self.buffer[end_idx + 2 :]
                    current_mode = self.mode
                    self.mode = "text"
                    try:
                        parsed = json.loads(raw_json)
                        if isinstance(parsed, dict):
                            if current_mode == "action" and "type" in parsed:
                                emit({"type": "action", "action": parsed})
                            elif current_mode == "memory" and "key" in parsed and "value" in parsed:
                                emit({"type": "memory", "memory": parsed})
                    except json.JSONDecodeError:
                        pass
                    continue
                break

    def flush(self) -> None:
        if self.mode == "text" and self.buffer:
            self._emit_token(self.buffer)
        self.buffer = ""


def build_candidate_models() -> List[str]:
    ordered: List[str] = []
    for m in [DEFAULT_GROQ_MODEL] + GROQ_FALLBACK_MODELS:
        if m and m not in ordered:
            ordered.append(m)
    return ordered


def stream_from_groq(
    api_key: str,
    messages: List[Dict[str, str]],
    store_context: Dict[str, Any],
    memories: List[Dict[str, Any]],
    recent_chats: List[Dict[str, Any]],
    store_url: str,
    lang: str,
) -> bool:
    system_prompt = build_system_prompt(store_context, memories, recent_chats, store_url, lang)
    groq_messages = [{"role": "system", "content": system_prompt}]
    for msg in messages[-20:]:
        role = msg.get("role")
        content = str(msg.get("content", "")).strip()
        if role in ("user", "assistant") and content:
            groq_messages.append({"role": role, "content": content[:4000]})

    last_error = ""
    for candidate_model in build_candidate_models():
        body = json.dumps(
            {
                "model": candidate_model,
                "messages": groq_messages,
                "temperature": 0.3,
                "max_tokens": 1400,
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
                "User-Agent": "Matgarak-Python-Copilot/2.0",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=45) as resp:
                emit({"type": "meta", "engine": "groq", "model": candidate_model})
                stream_filter = SmartTagStreamFilter()
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
                if stream_filter.emitted_chars > 0:
                    return True
                # If a reasoning model produced empty content, try next model
                last_error = f"{candidate_model} returned empty content"
                continue
        except urllib.error.HTTPError as exc:
            err_body = ""
            try:
                err_body = exc.read().decode("utf-8", errors="ignore")[:180]
            except Exception:
                pass
            last_error = f"HTTP {exc.code} ({candidate_model}): {err_body}"
            # Retry next model on 404/400/429/5xx
            continue
        except (urllib.error.URLError, TimeoutError) as exc:
            last_error = str(exc)
            break

    if last_error:
        sys.stderr.write(f"[Groq fallback triggered]: {last_error}\n")
    return False


def stream_text_smoothly(text: str) -> None:
    tokens = re.findall(r"\S+\s*|\n+", text)
    chunk_buf = ""
    for i, tok in enumerate(tokens):
        chunk_buf += tok
        if len(chunk_buf) >= 10 or "\n" in tok or i == len(tokens) - 1:
            emit({"type": "token", "delta": chunk_buf})
            chunk_buf = ""
            time.sleep(0.014)


def run_python_smart_copilot(
    user_message: str,
    store_context: Dict[str, Any],
    memories: List[Dict[str, Any]],
    store_url: str,
    lang: str,
) -> None:
    emit({"type": "meta", "engine": "python-local", "model": "python-store-copilot-v2"})

    store = store_context.get("store", {})
    metrics = store_context.get("metrics", {})
    products = store_context.get("products", [])
    orders = store_context.get("orders", [])
    customers = store_context.get("customers", [])
    discounts = store_context.get("discounts", [])

    currency = store.get("currency", "EGP")
    store_name = store.get("nameAr") if lang == "ar" else store.get("nameEn")
    slug = store.get("slug", "menz-club")
    live_url = store_url or f"/s/{slug}"
    text = user_message.strip()
    lower = text.lower()

    actions: List[Dict[str, Any]] = []
    mem_items: List[Dict[str, Any]] = []
    reply = ""

    # 0. Explicit Remember / Memory Storage
    if any(k in lower for k in ["افتكر", "تذكر", "احفظ في الذاكرة", "خليك فاكر", "remember that", "keep in mind", "save memory"]):
        clean_fact = re.sub(
            r"^(?:افتكر أن|افتكر ان|افتكر|تذكر أن|تذكر ان|تذكر|احفظ في الذاكرة|خليك فاكر|remember that|remember|keep in mind|save memory)\s*:?\s*",
            "",
            text,
            flags=re.IGNORECASE,
        ).strip()
        if clean_fact:
            key_slug = f"merchant_note_{int(time.time()) % 100000}"
            mem_items.append(
                {
                    "key": key_slug,
                    "value": clean_fact,
                    "category": "preference",
                    "importance": 5,
                }
            )
            reply = (
                f"تم حفظ المعلومة في **ذاكرة متجر {store_name} الدائمة في Supabase**:\n\n- {clean_fact}\n\nسأتذكرها تلقائياً في هذه المحادثة وفي جميع محادثاتك القادمة."
                if lang == "ar"
                else f"Saved permanently to **{store_name}'s Supabase memory**:\n\n- {clean_fact}\n\nI will recall this automatically in this chat and across all future chats."
            )

    # 1. Recall saved memories
    elif any(k in lower for k in ["فاكر ايه", "الذاكرة", "بتفتكر", "what do you remember", "my memories"]):
        if memories:
            lines = "\n".join(f"- **{m.get('memoryKey')}**: {m.get('memoryValue')}" for m in memories[:15])
            reply = (
                f"### الذاكرة المحفوظة لمتجر **{store_name}** في Supabase:\n\n{lines}"
                if lang == "ar"
                else f"### Saved Supabase Memories for **{store_name}**:\n\n{lines}"
            )
        else:
            reply = (
                "لا توجد معلومات محفوظة في الذاكرة الدائمة بعد. يمكنك إخباري بأي قاعدة أو تفضيل مثل: *\"افتكر أن الشحن المجاني للعملاء الـ VIP فوق 2000 جنيه\"*."
                if lang == "ar"
                else "No long-term memories are saved yet. Tell me any preference like: *\"Remember that our target margin is 40%\"*."
            )

    # 2. Create Discount
    elif any(k in lower for k in ["كود خصم", "كوبون", "خصم", "coupon", "discount", "promo"]):
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
        actions.append({"type": "create_discount", "payload": {"code": code, "type": disc_type, "value": 0 if disc_type == "free_shipping" else val, "minOrderValue": 0}})
        reply = (
            f"تم إنشاء وتفعيل كود الخصم `{code}` لمتجر **{store_name}** بنجاح ({int(val)}{'%' if disc_type=='percentage' else f' {currency}'})."
            if lang == "ar"
            else f"Created and activated promo code `{code}` for **{store_name}** ({int(val)}{'%' if disc_type=='percentage' else f' {currency}'})."
        )

    # 3. Add New Product
    elif any(k in lower for k in ["أضف منتج", "اضف منتج", "منتج جديد", "add product", "create product", "new product"]):
        price_match = re.search(r"(?:بسعر|سعر|price|at)\s*(\d{2,6})", lower)
        price = int(price_match.group(1)) if price_match else 1450
        name_clean = re.sub(
            r"(?:أضف منتج جديد|اضف منتج جديد|أضف منتج|اضف منتج|منتج جديد|add product|create product|new product)\s*:?",
            "",
            text,
            flags=re.IGNORECASE,
        ).strip()
        name_clean = re.split(r"(?:بسعر|سعر|ومقاسات|مقاسات|price|at\s+\d|sizes)", name_clean, maxsplit=1, flags=re.IGNORECASE)[0].strip(" -–:،,")
        name_final = name_clean if len(name_clean) >= 2 else ("بليزر كتان بيج فاخر" if lang == "ar" else "Beige Linen Blazer")
        sizes_found = re.findall(r"\b(XS|S|M|L|XL|XXL)\b", text.upper())
        sizes = list(dict.fromkeys(sizes_found)) if sizes_found else ["M", "L", "XL"]
        actions.append({
            "type": "create_product",
            "payload": {
                "nameAr": name_final,
                "nameEn": name_final,
                "price": price,
                "stock": 15,
                "sizes": sizes,
                "color": "Classic",
                "colorHex": "#1C1917",
                "visualType": "coat",
            },
        })
        reply = (
            f"تمت إضافة **{name_final}** بسعر **{price:,} {currency}** ومقاسات ({', '.join(sizes)}) مباشرة في متجر **{store_name}**."
            if lang == "ar"
            else f"Added **{name_final}** at **{price:,} {currency}** (sizes: {', '.join(sizes)}) directly to **{store_name}**."
        )

    # 4. Default Live Database Summary
    else:
        total_sales = metrics.get("totalSales", 0)
        total_orders = metrics.get("totalOrders", 0)
        pending_count = metrics.get("pendingCount", 0)
        if lang == "ar":
            reply = (
                f"### ملخص متجر **{store_name}** المباشر من قاعدة البيانات\n\n"
                f"- **رابط المتجر:** `{live_url}`\n"
                f"- **إجمالي المبيعات:** **{total_sales:,} {currency}**\n"
                f"- **الطلبات:** {total_orders} ({pending_count} قيد الانتظار)\n"
                f"- **المنتجات:** {len(products)} · **العملاء:** {len(customers)} · **أكواد الخصم:** {len(discounts)}\n"
                f"- **الذكريات المحفوظة في Supabase:** {len(memories)} معلومة"
            )
        else:
            reply = (
                f"### Live Database Summary — **{store_name}**\n\n"
                f"- **Storefront URL:** `{live_url}`\n"
                f"- **Total Revenue:** **{total_sales:,} {currency}**\n"
                f"- **Orders:** {total_orders} ({pending_count} pending)\n"
                f"- **Products:** {len(products)} · **Customers:** {len(customers)} · **Promo Codes:** {len(discounts)}\n"
                f"- **Saved Supabase Memories:** {len(memories)}"
            )

    stream_text_smoothly(reply)
    for act in actions:
        emit({"type": "action", "action": act})
    for mem in mem_items:
        emit({"type": "memory", "memory": mem})


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
    memories = data.get("memories") or []
    recent_chats = data.get("recentChats") or []
    store_url = str(data.get("storeUrl") or "")
    fallback_locale = "en" if data.get("locale") == "en" else "ar"

    last_user_msg = ""
    for m in reversed(messages):
        if m.get("role") == "user":
            last_user_msg = str(m.get("content", ""))
            break

    lang = "ar" if is_arabic_text(last_user_msg) else ("en" if last_user_msg.strip() else fallback_locale)

    groq_api_key = os.environ.get("GROQ_API_KEY", "").strip()
    if groq_api_key and not groq_api_key.startswith("YOUR_"):
        ok = stream_from_groq(
            groq_api_key,
            messages,
            store_context,
            memories,
            recent_chats,
            store_url,
            lang,
        )
        if not ok:
            run_python_smart_copilot(last_user_msg, store_context, memories, store_url, lang)
    else:
        run_python_smart_copilot(last_user_msg, store_context, memories, store_url, lang)

    emit({"type": "done"})


if __name__ == "__main__":
    main()
