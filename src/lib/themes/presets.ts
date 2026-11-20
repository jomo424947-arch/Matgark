import type {
  StoreSection,
  StoreTheme,
  StoreThemePresetId,
} from "@/types/saas"

export interface ThemePresetDefinition {
  id: StoreThemePresetId
  nameAr: string
  nameEn: string
  categoryAr: string
  categoryEn: string
  descriptionAr: string
  descriptionEn: string
  theme: StoreTheme
}

export const STORE_THEME_PRESETS: ThemePresetDefinition[] = [
  {
    id: "minimal-fashion",
    nameAr: "أتيليه مينيمال (Minimal Atelier)",
    nameEn: "Minimal Atelier",
    categoryAr: "أزياء كلاسيكية ومينيمال",
    categoryEn: "Tailored & Minimal Apparel",
    descriptionAr:
      "خلفية بيضاء نقية وتايبوغرافي تحريري يبرز تفاصيل القصّات والخامات لبراندات الملابس الرجالي والنسائي.",
    descriptionEn:
      "Pure alabaster canvas, refined typography, and architectural framing for tailored menswear and womenswear.",
    theme: {
      presetId: "minimal-fashion",
      primaryColor: "#111111",
      secondaryColor: "#F4F3F0",
      accentColor: "#B45309",
      backgroundColor: "#FFFFFF",
      surfaceColor: "#F9F8F6",
      textColor: "#111111",
      mutedTextColor: "#6B6B6B",
      fontFamily: "editorial",
      borderRadius: "sm",
      buttonStyle: "square",
      headerStyle: "minimal",
      productCardStyle: "editorial",
    },
  },
  {
    id: "modern-cosmetics",
    nameAr: "بوتيك ناعم وعبايات (Soft Boutique)",
    nameEn: "Soft Boutique & Modest",
    categoryAr: "عبايات، فساتين وأزياء نسائية",
    categoryEn: "Modest Wear & Dresses",
    descriptionAr:
      "درجات دافئة وناعمة بلمسة فخامة مثالية لبوتيكات العبايات وملابس المحجبات والأزياء النسائية الراقية.",
    descriptionEn:
      "Warm sand tones, soft card framing, and graceful spacing tailored for abayas, dresses, and modest fashion.",
    theme: {
      presetId: "modern-cosmetics",
      primaryColor: "#4A2C2A",
      secondaryColor: "#F5ECE8",
      accentColor: "#B86B52",
      backgroundColor: "#FBF8F5",
      surfaceColor: "#FFFFFF",
      textColor: "#2B1E1C",
      mutedTextColor: "#7A6561",
      fontFamily: "editorial",
      borderRadius: "lg",
      buttonStyle: "pill",
      headerStyle: "centered",
      productCardStyle: "soft-card",
    },
  },
  {
    id: "electronics-pro",
    nameAr: "ستريت وير عصري (Urban Streetwear)",
    nameEn: "Urban Streetwear",
    categoryAr: "ستريت وير، هوديز وملابس شبابية",
    categoryEn: "Streetwear & Capsule Drops",
    descriptionAr:
      "تخطيط جريء بتباين عالٍ وعرض واضح للمقاسات والكميات المحدودة لبراندات الستريت وير والملابس الرياضية.",
    descriptionEn:
      "High-contrast editorial grid with bold size callouts built for hoodies, denim, and limited clothing drops.",
    theme: {
      presetId: "electronics-pro",
      primaryColor: "#18181B",
      secondaryColor: "#F1F5F9",
      accentColor: "#C26D2D",
      backgroundColor: "#F8FAFC",
      surfaceColor: "#FFFFFF",
      textColor: "#0F172A",
      mutedTextColor: "#475569",
      fontFamily: "technical",
      borderRadius: "md",
      buttonStyle: "rounded",
      headerStyle: "structured",
      productCardStyle: "spec-grid",
    },
  },
]

export function getPresetById(id: StoreThemePresetId): ThemePresetDefinition {
  return (
    STORE_THEME_PRESETS.find((p) => p.id === id) ?? STORE_THEME_PRESETS[0]
  )
}

export function getRadiusPixels(radius: StoreTheme["borderRadius"]): string {
  switch (radius) {
    case "none":
      return "0px"
    case "sm":
      return "4px"
    case "md":
      return "10px"
    case "lg":
      return "16px"
    case "xl":
      return "24px"
    default:
      return "8px"
  }
}

export function getButtonRadiusPixels(
  buttonStyle: StoreTheme["buttonStyle"]
): string {
  switch (buttonStyle) {
    case "square":
      return "2px"
    case "pill":
      return "9999px"
    case "rounded":
    default:
      return "10px"
  }
}

/**
 * Generates CSS custom properties for data-driven storefront theming.
 */
export function themeToCssVariables(
  theme: StoreTheme
): Record<string, string> {
  return {
    "--sf-primary": theme.primaryColor,
    "--sf-secondary": theme.secondaryColor,
    "--sf-accent": theme.accentColor,
    "--sf-bg": theme.backgroundColor,
    "--sf-surface": theme.surfaceColor,
    "--sf-text": theme.textColor,
    "--sf-muted": theme.mutedTextColor,
    "--sf-radius": getRadiusPixels(theme.borderRadius),
    "--sf-btn-radius": getButtonRadiusPixels(theme.buttonStyle),
  }
}

export function createDefaultSections(params: {
  brandNameAr: string
  brandNameEn: string
  visualVariant: "fashion" | "cosmetics" | "electronics" | "minimal"
  announcementAr?: string
  announcementEn?: string
  heroTitleAr?: string
  heroTitleEn?: string
  heroSubtitleAr?: string
  heroSubtitleEn?: string
}): StoreSection[] {
  return [
    {
      id: "sec-announcement",
      type: "announcement",
      visible: true,
      order: 0,
      titleAr:
        params.announcementAr ||
        "شحن مجاني للطلبات فوق 1,500 ج.م — استخدم كود NOVA10 لخصم 10%",
      titleEn:
        params.announcementEn ||
        "Complimentary shipping on orders over 1,500 EGP — Use code NOVA10 for 10% off",
      subtitleAr: "",
      subtitleEn: "",
    },
    {
      id: "sec-hero",
      type: "hero",
      visible: true,
      order: 1,
      badgeAr: "تشكيلة الموسم الجديد 2026",
      badgeEn: "Autumn / Winter Collection 2026",
      titleAr: params.heroTitleAr || `أناقة متفردة من ${params.brandNameAr}`,
      titleEn:
        params.heroTitleEn || `Architectural Essentials by ${params.brandNameEn}`,
      subtitleAr:
        params.heroSubtitleAr ||
        "قطع مصممة بعناية فائقة وخامات مختارة لتدوم طويلاً مع توصيل سريع لجميع المحافظات.",
      subtitleEn:
        params.heroSubtitleEn ||
        "Thoughtfully crafted pieces designed for everyday longevity, delivered straight from our studio to your door.",
      ctaLabelAr: "تسوّق التشكيلة الآن",
      ctaLabelEn: "Explore Collection",
      ctaHref: "products",
      visualVariant: params.visualVariant,
    },
    {
      id: "sec-categories",
      type: "featured_categories",
      visible: true,
      order: 2,
      titleAr: "تسوّق حسب القسم",
      titleEn: "Shop by Category",
      subtitleAr: "استكشف الأقسام المختارة بعناية",
      subtitleEn: "Curated departments built around your daily routine",
    },
    {
      id: "sec-best-sellers",
      type: "best_sellers",
      visible: true,
      order: 3,
      titleAr: "الأكثر مبيعاً",
      titleEn: "Best Sellers",
      subtitleAr: "القطع المفضلة لدى عملائنا هذا الموسم",
      subtitleEn: "Most-loved pieces selected by our community",
      ctaLabelAr: "عرض كل المنتجات",
      ctaLabelEn: "View All Products",
      ctaHref: "products",
    },
    {
      id: "sec-promo",
      type: "promo_banner",
      visible: true,
      order: 4,
      badgeAr: "عرض حصري",
      badgeEn: "Seasonal Edition",
      titleAr: "جودة أصلية مع استبدال سهل خلال 14 يوماً",
      titleEn: "Crafted to Last — 14-Day Effortless Exchange",
      subtitleAr:
        "اطلب بثقة مع الدفع عند الاستلام وفحص الشحنة قبل القبول.",
      subtitleEn:
        "Order with confidence using Cash on Delivery or bank transfer across every region.",
      ctaLabelAr: "اكتشف الجديد",
      ctaLabelEn: "Shop New Arrivals",
      ctaHref: "products?sort=newest",
      visualVariant: params.visualVariant,
    },
    {
      id: "sec-new-arrivals",
      type: "new_arrivals",
      visible: true,
      order: 5,
      titleAr: "وصل حديثاً",
      titleEn: "New Arrivals",
      subtitleAr: "أحدث الإصدارات التي أضيفت إلى المتجر",
      subtitleEn: "Fresh releases just landed in our catalog",
    },
    {
      id: "sec-brand-story",
      type: "brand_story",
      visible: true,
      order: 6,
      badgeAr: "قصتنا",
      badgeEn: "Our Story",
      titleAr: `صُنع بشغف في ${params.brandNameAr}`,
      titleEn: `Designed with Intention at ${params.brandNameEn}`,
      subtitleAr:
        "نؤمن بأن التفاصيل الصغيرة تصنع الفارق الأكبر. نختار أفضل الخامات ونراجع كل قطعة قبل شحنها لتصلك بأعلى مستوى من الجودة.",
      subtitleEn:
        "We believe enduring quality starts with honest materials, disciplined tailoring, and direct relationships with our customers.",
    },
    {
      id: "sec-newsletter",
      type: "newsletter",
      visible: true,
      order: 7,
      titleAr: "انضم لقائمتنا البريدية",
      titleEn: "Join Our Private List",
      subtitleAr:
        "احصل على أولوية الوصول للتشكيلات الجديدة وخصومات حصرية للمشتركين.",
      subtitleEn:
        "Early access to limited drops, restock alerts, and subscriber-only offers.",
      ctaLabelAr: "اشترك الآن",
      ctaLabelEn: "Subscribe",
    },
  ]
}
