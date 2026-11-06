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

# تشغيل خادم التطوير
npm run dev
```

افتح المتصفح على:
- **الموقع الرئيسي واللاندينج بيج:** [http://localhost:3000](http://localhost:3000)
- **تسجيل تاجر جديد:** [http://localhost:3000/register](http://localhost:3000/register)
- **تسجيل الدخول:** [http://localhost:3000/login](http://localhost:3000/login)
- **لوحة تحكم التاجر (Dashboard):** [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **إدارة المنتجات:** [http://localhost:3000/products](http://localhost:3000/products)
- **إضافة منتج جديد:** [http://localhost:3000/products/new](http://localhost:3000/products/new)
- **إدارة الأوردرات:** [http://localhost:3000/orders](http://localhost:3000/orders)
- **إعدادات المتجر:** [http://localhost:3000/settings](http://localhost:3000/settings)
- **واجهة متجر تجريبي للعميل:** [http://localhost:3000/store/cairo-couture](http://localhost:3000/store/cairo-couture)

---

## 📁 هيكل الفولدرات

```
matgarak/
├── src/
│   ├── app/
│   │   ├── (auth)/                  # صفحات التسجيل والدخول
│   │   │   ├── login/page.tsx       # تسجيل برقم الموبايل + OTP
│   │   │   └── register/page.tsx    # حجز المتجر والـ slug
│   │   ├── (dashboard)/             # لوحة تحكم التاجر
│   │   │   ├── layout.tsx           # Sidebar + Header
│   │   │   ├── dashboard/page.tsx   # إحصائيات وأحدث الأوردرات
│   │   │   ├── products/page.tsx    # قائمة المنتجات
│   │   │   ├── products/new/page.tsx # إضافة منتج جديد
│   │   │   ├── orders/page.tsx      # إدارة ومتابعة الأوردرات
│   │   │   └── settings/page.tsx    # إعدادات المتجر ورسوم الشحن
│   │   ├── store/[slug]/page.tsx    # متجر العميل (Storefront) + سلة + Guest Checkout
│   │   ├── layout.tsx               # Root Layout مع Cairo Font و ThemeProvider
│   │   ├── globals.css              # إعدادات Tailwind وألوان الهوية
│   │   └── page.tsx                 # اللاندينج بيج الرئيسية (10 أقسام)
│   │
│   ├── components/
│   │   ├── ui/                      # مكونات الـ Design System (Logo, Button, Input, Card, Badge)
│   │   ├── layout/                  # ThemeProvider, ThemeToggle
│   │   └── landing/                 # مكونات اللاندينج بيج (Hero, Features, Pricing, etc.)
│   │
│   ├── stores/
│   │   └── cartStore.ts             # إدارة سلة المشتريات (Zustand)
│   │
│   └── lib/
│       └── utils.ts                 # أدوات مساعدة وتنسيق العملات
```

---

## 🛠️ التقنيات المستخدمة

- **Next.js 16 (App Router + Turbopack)**
- **React 19 & TypeScript**
- **Tailwind CSS 4**
- **Zustand** (إدارة سلة التسوق والـ State)
- **next-themes** (الوضع الليلي والنهاري)
- **Lucide React** (أيقونات واجهة المستخدم)
- **Sonner** (إشعارات وتنبيهات)
