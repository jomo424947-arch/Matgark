// Seed Matgarak database with initial demo data via Supabase REST API
// Run: node scripts/seed-db.mjs

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// Load .env if present
try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    for (const line of envContent.split("\n")) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = (match[2] || "").trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
} catch {}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment or .env file.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function seed() {
  console.log("🌱 Seeding Matgarak database...\n");

  // 1. Check if already seeded
  const { data: existingUsers } = await supabase.from("users").select("id").limit(1);
  if (existingUsers && existingUsers.length > 0) {
    console.log("⚠️  Database already has data. Skipping seed.");
    console.log("   To re-seed, delete all data first.\n");
    return;
  }

  // 2. Create user
  console.log("👤 Creating merchant user...");
  const { data: user, error: userErr } = await supabase
    .from("users")
    .insert({ phone: "01012345678" })
    .select()
    .single();

  if (userErr) {
    console.error("  ❌ Failed:", userErr.message);
    return;
  }
  console.log(`  ✅ User: ${user.id}`);

  // 3. Create store
  console.log("🏪 Creating store...");
  const { data: store, error: storeErr } = await supabase
    .from("stores")
    .insert({
      owner_id: user.id,
      name: "براند كايرو كوتور",
      slug: "cairo-couture",
      slogan: "أحدث صيحات الملابس الشتوية والكاجوال العصرية في مصر",
      phone: "01012345678",
      whatsapp: "01012345678",
      delivery_type: "flat",
      flat_fee: 40,
      free_above: 1000,
      city_fees: { "القاهرة": 40, "الجيزة": 45, "الإسكندرية": 60 },
      theme_color: "#E8732A",
      order_seq: 1048,
      plan: "pro",
    })
    .select()
    .single();

  if (storeErr) {
    console.error("  ❌ Failed:", storeErr.message);
    return;
  }
  console.log(`  ✅ Store: ${store.id} (${store.slug})`);

  // 4. Create products with variants
  console.log("📦 Creating products...");

  const productsData = [
    {
      store_id: store.id,
      name: "جاكيت شتوي أوفرسايز صوف فاخر",
      price: 850,
      category: "ملابس شتوية",
      description: "خامة صوف معالج ضد الانكماش مع بطانة داخلية دافئة.",
      image: "🧥",
      stock: 12,
      status: "نشط",
      variants: [
        { size: "M", color: "أسود", stock: 4 },
        { size: "L", color: "أسود", stock: 4 },
        { size: "XL", color: "زيتي", stock: 4 },
      ],
    },
    {
      store_id: store.id,
      name: "سنيكرز جلد أبيض مريح",
      price: 620,
      category: "أحذية",
      description: "نعل طبي مبطن مريح للارتداء طوال اليوم وتصميم أنيق.",
      image: "👟",
      stock: 4,
      status: "مخزون منخفض",
      variants: [
        { size: "38", color: "أبيض", stock: 1 },
        { size: "39", color: "أبيض", stock: 1 },
        { size: "40", color: "أبيض", stock: 1 },
        { size: "41", color: "أبيض", stock: 1 },
      ],
    },
    {
      store_id: store.id,
      name: "هودي ميلتون مصري مبطن",
      price: 550,
      category: "ملابس كاجوال",
      description: "قطن مصري 100% عالي الجودة مع وبرة ناعمة داخلية.",
      image: "👕",
      stock: 20,
      status: "نشط",
      variants: [
        { size: "S", color: "رمادي", stock: 5 },
        { size: "M", color: "رمادي", stock: 5 },
        { size: "L", color: "كحلي", stock: 5 },
        { size: "XL", color: "نبيتي", stock: 5 },
      ],
    },
    {
      store_id: store.id,
      name: "بنطلون كارجو قطن بجيوب",
      price: 490,
      category: "بناطيل",
      description: "خامة قطنية متينة مع 6 جيوب عملية وتصميم مريح.",
      image: "👖",
      stock: 0,
      status: "نفذ المخزون",
      variants: [
        { size: "30", color: "بيج", stock: 0 },
        { size: "32", color: "زيتي", stock: 0 },
        { size: "34", color: "أسود", stock: 0 },
      ],
    },
  ];

  const productIds = [];
  const allVariantRows = [];

  for (const p of productsData) {
    const { variants, ...productRow } = p;
    const { data: product, error: pErr } = await supabase
      .from("products")
      .insert(productRow)
      .select()
      .single();

    if (pErr) {
      console.error(`  ❌ Product "${p.name}":`, pErr.message);
      continue;
    }

    productIds.push(product.id);
    console.log(`  ✅ Product: ${product.name}`);

    for (const v of variants) {
      allVariantRows.push({ product_id: product.id, ...v });
    }
  }

  if (allVariantRows.length > 0) {
    const { error: vErr } = await supabase
      .from("product_variants")
      .insert(allVariantRows);
    if (vErr) console.error("  ❌ Variants:", vErr.message);
    else console.log(`  ✅ ${allVariantRows.length} variants created`);
  }

  // 5. Create customers
  console.log("👥 Creating customers...");
  const customersData = [
    {
      store_id: store.id,
      name: "محمد علي",
      phone: "01098765432",
      city: "القاهرة",
      total_orders: 3,
      total_spent: 2450,
      last_order: "اليوم",
      tag: "عميل مميز ⭐",
    },
    {
      store_id: store.id,
      name: "نورين شريف",
      phone: "01234567890",
      city: "الجيزة",
      total_orders: 2,
      total_spent: 1840,
      last_order: "اليوم",
      tag: "نشط",
    },
    {
      store_id: store.id,
      name: "عمر خالد",
      phone: "01122334455",
      city: "الإسكندرية",
      total_orders: 1,
      total_spent: 590,
      last_order: "أمس",
      tag: "جديد",
    },
    {
      store_id: store.id,
      name: "ياسمين فهمي",
      phone: "01599887766",
      city: "القاهرة",
      total_orders: 4,
      total_spent: 3120,
      last_order: "منذ يومين",
      tag: "عميل مميز ⭐",
    },
    {
      store_id: store.id,
      name: "أحمد حسام",
      phone: "01011223388",
      city: "المنصورة",
      total_orders: 1,
      total_spent: 490,
      last_order: "منذ 4 أيام",
      tag: "جديد",
    },
  ];

  const { data: customers, error: custErr } = await supabase
    .from("customers")
    .insert(customersData)
    .select();

  if (custErr) {
    console.error("  ❌ Customers:", custErr.message);
  } else {
    console.log(`  ✅ ${customers.length} customers created`);
  }

  // Map customer phones to IDs for orders
  const customerMap = {};
  for (const c of customers || []) {
    customerMap[c.phone] = c.id;
  }

  // 6. Create orders with items and status history
  console.log("📋 Creating orders...");

  // We need product IDs - fetch them
  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .eq("store_id", store.id);

  const productMap = {};
  for (const p of products || []) {
    productMap[p.name] = p.id;
  }

  // Fetch variant IDs
  const { data: variants } = await supabase
    .from("product_variants")
    .select("id, product_id, size, color")
    .in("product_id", Object.values(productMap));

  const variantMap = {};
  for (const v of variants || []) {
    variantMap[`${v.product_id}-${v.size}-${v.color}`] = v.id;
  }

  const ordersData = [
    {
      order_number: "1048",
      store_id: store.id,
      customer_id: customerMap["01098765432"],
      customer_name: "محمد علي",
      customer_phone: "01098765432",
      customer_city: "القاهرة",
      customer_address: "مدينة نصر، شارع عباس العقاد، عمارة 14، شقة 5",
      customer_notes: "يرجى الاتصال قبل الوصول",
      subtotal: 850,
      delivery_fee: 40,
      total: 890,
      status: "جديد",
      created_at: "2026-01-14T15:40:00.000Z",
      items: [
        {
          product_name: "جاكيت شتوي أوفرسايز صوف فاخر",
          unit_price: 850,
          size: "L",
          color: "أسود",
          quantity: 1,
        },
      ],
      history: [
        { status: "جديد", note: "تم استلام الطلب من متجر العميل", created_at: "2026-01-14T15:40:00.000Z" },
      ],
    },
    {
      order_number: "1047",
      store_id: store.id,
      customer_id: customerMap["01234567890"],
      customer_name: "نورين شريف",
      customer_phone: "01234567890",
      customer_city: "الجيزة",
      customer_address: "الدقي، شارع مصدق، برج الأطباء",
      customer_notes: "",
      subtotal: 1170,
      delivery_fee: 0,
      total: 1170,
      status: "مؤكد",
      created_at: "2026-01-14T13:15:00.000Z",
      items: [
        {
          product_name: "سنيكرز جلد أبيض مريح",
          unit_price: 620,
          size: "38",
          color: "أبيض",
          quantity: 1,
        },
        {
          product_name: "هودي ميلتون مصري مبطن",
          unit_price: 550,
          size: "M",
          color: "رمادي",
          quantity: 1,
        },
      ],
      history: [
        { status: "جديد", created_at: "2026-01-14T13:15:00.000Z" },
        { status: "مؤكد", note: "تم التأكيد هاتفياً", created_at: "2026-01-14T13:30:00.000Z" },
      ],
    },
    {
      order_number: "1046",
      store_id: store.id,
      customer_id: customerMap["01122334455"],
      customer_name: "عمر خالد",
      customer_phone: "01122334455",
      customer_city: "الإسكندرية",
      customer_address: "سموحة، بجوار نادي سموحة، عمارة الأمل",
      customer_notes: "مندوب الشحن: أ/ هاني (01011223344)",
      subtotal: 550,
      delivery_fee: 40,
      total: 590,
      status: "جاري الشحن",
      created_at: "2026-01-13T20:30:00.000Z",
      items: [
        {
          product_name: "هودي ميلتون مصري مبطن",
          unit_price: 550,
          size: "XL",
          color: "نبيتي",
          quantity: 1,
        },
      ],
      history: [
        { status: "جديد", created_at: "2026-01-13T20:30:00.000Z" },
        { status: "جاري الشحن", created_at: "2026-01-14T09:00:00.000Z" },
      ],
    },
    {
      order_number: "1045",
      store_id: store.id,
      customer_id: customerMap["01599887766"],
      customer_name: "ياسمين فهمي",
      customer_phone: "01599887766",
      customer_city: "القاهرة",
      customer_address: "التجمع الخامس، النرجس 2، فيلا 18",
      customer_notes: "تم تحصيل المبلغ كاش",
      subtotal: 850,
      delivery_fee: 0,
      total: 850,
      status: "تم التسليم",
      created_at: "2026-01-12T10:00:00.000Z",
      items: [
        {
          product_name: "جاكيت شتوي أوفرسايز صوف فاخر",
          unit_price: 850,
          size: "M",
          color: "أسود",
          quantity: 1,
        },
      ],
      history: [
        { status: "جديد", created_at: "2026-01-12T10:00:00.000Z" },
        { status: "تم التسليم", created_at: "2026-01-13T17:00:00.000Z" },
      ],
    },
  ];

  for (const orderData of ordersData) {
    const { items, history, ...orderRow } = orderData;

    const { data: order, error: oErr } = await supabase
      .from("orders")
      .insert(orderRow)
      .select()
      .single();

    if (oErr) {
      console.error(`  ❌ Order #${orderData.order_number}:`, oErr.message);
      continue;
    }
    console.log(`  ✅ Order #${order.order_number}`);

    // Insert order items
    const itemRows = items.map((item) => {
      const prodId = productMap[item.product_name];
      const varId = variantMap[`${prodId}-${item.size}-${item.color}`];
      return {
        order_id: order.id,
        product_id: prodId || null,
        variant_id: varId || null,
        name_snapshot: item.product_name,
        unit_price: item.unit_price,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
      };
    });

    await supabase.from("order_items").insert(itemRows);

    // Insert status history
    const historyRows = history.map((h) => ({
      order_id: order.id,
      status: h.status,
      note: h.note || null,
      created_at: h.created_at,
    }));

    await supabase.from("order_status_history").insert(historyRows);
  }

  console.log("\n🎉 Seed completed successfully!");
  console.log("   Merchant phone: 01012345678");
  console.log("   Store slug: cairo-couture");
}

seed().catch(console.error);
