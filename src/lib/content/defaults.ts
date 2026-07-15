export const WHY_BARAKATLY_KEY = "why_barakatly" as const;

export type WhyBarakatlyFeature = {
  title: string;
  description: string;
  icon: string;
};

export const WHY_BARAKATLY_DEFAULT_FEATURES: WhyBarakatlyFeature[] = [
  {
    title: "Həmişə təzə",
    description:
      "Məhsullar 24–48 saat ərzində yığılır və çatdırılır ki, maksimum təravət qorunsun.",
    icon: "🌿",
  },
  {
    title: "Keyfiyyət zəmanəti",
    description:
      "Hər məhsul yoxlanılır və sertifikatlı fermerlərdən seçilir.",
    icon: "🛡️",
  },
  {
    title: "Sürətli çatdırılma",
    description:
      "Fermerdən birbaşa qapınıza — eyni gün və ya növbəti gün çatdırılma seçimləri.",
    icon: "🚚",
  },
  {
    title: "Yerliyə dəstək",
    description:
      "Alışlarınız yerli təsərrüfatları və icmaları birbaşa dəstəkləyir.",
    icon: "🤝",
  },
];

export const WHY_BARAKATLY_DEFAULT = {
  key: WHY_BARAKATLY_KEY,
  title: "Niyə Barakatly?",
  body: "Fermer məhsullarını hər kəs üçün daha əlçatan edirik",
  items: WHY_BARAKATLY_DEFAULT_FEATURES,
} as const;
