# 🛍️ منصة متجرك (Matgarak)

> **منصة متاجر إلكترونية للمحلات والمشاريع الصغيرة والبراندات**
> "من البراندات الصغيرة .. إلى بيتك"

---

## 🎨 الهوية البصرية والمميزات

- **اللوجو المعتمد:** شنطة تسوق أنيقة مع حرف `M` باللون البرتقالي الرسمي (`#E8732A`).
- **Dark & Light Mode:**
  - الوضع الفاتح (Light): خلفية بيج دافي (`#FAF8F5`) مثل الهوية البصرية، مع لوجو أسود وبرتقالي.
  - الوضع الداكن (Dark): خلفية سوداء فخمة (`#18181B`) مع لوجو أبيض وبرتقالي.
- **الخط العربي:** خط **Cairo** المدمج بكافة أوزانه من Google Fonts.
- **دعم RTL كامل:** متوافق 100% مع الاتجاه العربي وMobile-First.

---

## 🚀 طريقة التشغيل السريعة

```bash
# الانتقال لمجلد المشروع
cd matgarak

# تثبيت الاعتماديات
npm install

# تشغيل خادم التطوير
npm run dev
```

افتح المتصفح على:
- **الموقع الرئيسي واللاندينج بيج:** [http://localhost:3000](http://localhost:3000)
- **تسجيل تاجر جديد:** [http://localhost:3000/register](http://localhost:3000/register)
- **تسجيل الدخول (OTP حقيقي):** [http://localhost:3000/login](http://localhost:3000/login)
  - *رقم الاختبار المعتمد:* `01012345678` (يظهر كود الـ 6 أرقام في التيرمينال وزر تعبئة سريع في الصفحة).
- **لوحة تحكم التاجر (Dashboard):** [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **إدارة المنتجات والمخزون:** [http://localhost:3000/dashboard/products](http://localhost:3000/dashboard/products)
- **إضافة منتج جديد:** [http://localhost:3000/dashboard/products/new](http://localhost:3000/dashboard/products/new)
- **إدارة الأوردرات وتحديث الحالات:** [http://localhost:3000/dashboard/orders](http://localhost:3000/dashboard/orders)
- **قائمة العملاء وتصدير Excel:** [http://localhost:3000/dashboard/customers](http://localhost:3000/dashboard/customers)
- **إعدادات المتجر ورسوم الشحن:** [http://localhost:3000/dashboard/settings](http://localhost:3000/dashboard/settings)
- **واجهة متجر العميل (Storefront):** [http://localhost:3000/cairo-couture](http://localhost:3000/cairo-couture) (أو `/store/cairo-couture`)

---

## 🧪 الفحص والاختبارات الآلية

```bash
# تشغيل مجموعة الاختبارات الآلية (14 اختبار للـ Auth والطلبات والمخزون والتحقق)
npm test

# فحص شامل (TypeScript + ESLint + الاختبارات)
npm run check

# تجربة بناء الإنتاج
npm run build
```

---

## 📁 هيكل المشروع

```
matgarak/
├── src/
│   ├── app/
│   │   ├── (auth)/                  # صفحات التسجيل والدخول
│   │   │   ├── login/page.tsx       # تسجيل برقم الموبايل + 6-digit OTP
│   │   │   └── register/page.tsx    # حجز المتجر والـ slug
│   │   ├── (onboarding)/            # تهيئة المتجر لأول مرة
│   │   ├── dashboard/               # لوحة تحكم التاجر الحقيقية
│   │   │   ├── layout.tsx           # Sidebar محمي + Header + تبديل الوضع
│   │   │   ├── page.tsx             # إحصائيات حية وأحدث الأوردرات
│   │   │   ├── products/            # جدول المنتجات والفلترة والتعديل والحذف
│   │   │   ├── products/new/        # إضافة منتج بالصور والمقاسات والمخزون
│   │   │   ├── orders/              # إدارة الأوردرات وتغيير الحالات
│   │   │   ├── customers/           # قائمة العملاء وتصدير ملف CSV
│   │   │   └── settings/            # إعدادات المتجر والشحن حسب المحافظة
│   │   ├── [slug]/page.tsx          # الرابط الأساسي لمتجر العميل (matgarak.com/{slug})
│   │   ├── store/[slug]/page.tsx    # مسار بديل متوافق لمتجر العميل
│   │   ├── privacy/ & terms/ ...    # الصفحات القانونية وصفحة التواصل
│   │   ├── not-found.tsx            # صفحة 404 مخصصة
│   │   ├── error.tsx                # صفحة معالجة الأخطاء
│   │   ├── layout.tsx               # Root Layout مع Cairo Font و ThemeProvider
│   │   └── page.tsx                 # اللاندينج بيج الرئيسية (10 أقسام)
│   │
│   ├── proxy.ts                     # حماية مسارات الداشبورد وتطبيق Security Headers
│   ├── server/                      # منطق الخادم وقاعدة البيانات
│   │   ├── db/client.ts             # محرك قاعدة بيانات ذري ومعاملات متزامنة
│   │   ├── db/seed-data.ts          # بيانات تجريبية متناسقة حسابياً
│   │   ├── auth/otp.ts              # توليد وتشفير والتحقق من كود الـ OTP
│   │   ├── auth/session.ts          # إدارة الجلسات وكوكيز HttpOnly مشفرة
│   │   ├── auth/dal.ts              # طبقة التحقق من صلاحيات التاجر
│   │   └── actions/                 # دوال Server Actions آمنة ومحمية
│   │
│   ├── components/
│   │   ├── store/                   # مكونات متجر العميل وسلة الشراء والـ Checkout
│   │   ├── ui/                      # مكونات الـ Design System (Logo, Button, Input, Card, Badge)
│   │   ├── layout/                  # ThemeProvider, ThemeToggle
│   │   └── landing/                 # مكونات اللاندينج بيج
│   │
│   ├── stores/
│   │   └── cartStore.ts             # سلة المشتريات المعزولة لكل متجر مع LocalStorage
│   │
│   ├── lib/
│   │   ├── whatsapp.ts              # تشفير وتنسيق روابط واتساب
│   │   ├── reserved-slugs.ts        # حظر المسارات المحجوزة
│   │   ├── validation/schemas.ts    # مخططات Zod للتحقق من المدخلات
│   │   └── utils.ts                 # أدوات مساعدة وتنسيق العملات
│   │
│   └── types/
│       └── domain.ts                # الأنواع الموحدة للمشروع
│
├── supabase/
│   └── migrations/
│       └── 0001_initial_schema.sql  # سكربت PostgreSQL كامل مع Row Level Security
│
└── tests/
    └── matgarak.test.ts             # اختبارات التحقق من العمليات الحساسة
```

---

## 🛠️ التقنيات المستخدمة

- **Next.js 16 (App Router + Turbopack + Cache Components)**
- **React 19 & TypeScript**
- **Tailwind CSS 4**
- **Zustand (Persisted Cart)**
- **Zod (Server & Client Validation)**
- **Sonner (الإشعارات والتنبيهات)**
- **Node Test Runner & TSX (الاختبارات الآلية)**
