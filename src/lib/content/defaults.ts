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

export const FAQ_KEY = "faq" as const;

export type FaqItem = {
  question: string;
  answer: string;
};

export const FAQ_DEFAULT_ITEMS: FaqItem[] = [
  {
    question: "Məhsullar nə qədər təzə olur?",
    answer:
      "Məhsullar adətən yığıldıqdan sonra 24–48 saat ərzində çatdırılır. Bu, maksimum təravət və qida dəyərini qorumağa kömək edir.",
  },
  {
    question: "Bir neçə fermerdən eyni sifarişdə ala bilərəm?",
    answer:
      "Bəli. Müxtəlif fermerlərin məhsullarını bir səbətdə toplaya bilərsiniz. Sistem sifarişi avtomatik qruplaşdırır və çatdırılmanı koordinasiya edir.",
  },
  {
    question: "Çatdırılma necə işləyir?",
    answer:
      "Kuryer şəbəkəmiz məhsulları fermerlərdən götürür və qapınıza çatdırır. Sifarişinizi real vaxtda izləmək mümkün olacaq.",
  },
  {
    question: "Məhsulların orqanik olması necə təsdiqlənir?",
    answer:
      "Orqanik məhsul iddia edən fermerlərin sertifikatlarını yoxlayırıq. Məhsullarda “Orqanik” nişanını görə bilərsiniz.",
  },
];

export const FAQ_DEFAULT = {
  key: FAQ_KEY,
  title: "Tez-tez verilən suallar",
  body: "",
  items: FAQ_DEFAULT_ITEMS,
} as const;
