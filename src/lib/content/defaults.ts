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

export const HERO_KEY = "hero" as const;

export type HeroItems = {
  highlight: string;
  imageUrl: string;
};

export const HERO_DEFAULT_IMAGE_URL =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=2400&q=80";

export const HERO_DEFAULT_ITEMS: HeroItems = {
  highlight: "birbaşa süfrənizə.",
  imageUrl: HERO_DEFAULT_IMAGE_URL,
};

export const HERO_DEFAULT = {
  key: HERO_KEY,
  title: "Fermerdən,",
  body: "Mövsümi məhsulları birbaşa yerli fermerlərdən kəşf edin. Daha sağlam qidalanaraq icmanızı dəstəkləyin.",
  items: HERO_DEFAULT_ITEMS,
} as const;

export const ABOUT_KEY = "about" as const;

export type AboutValue = {
  title: string;
  text: string;
};

export type AboutItems = {
  missionTitle: string;
  missionBody: string;
  values: AboutValue[];
  farmerTitle: string;
  farmerBody: string;
};

export const ABOUT_DEFAULT_VALUES: AboutValue[] = [
  {
    title: "Birbaşa fermerdən",
    text: "Ara vasitəçiləri azaldırıq ki, məhsul daha təzə, qiymət isə daha ədalətli olsun.",
  },
  {
    title: "İzlənəbilən mənşə",
    text: "Hər sifarişdə təsərrüfat, mənşə və çatdırılma yolu şəffaf qalır.",
  },
  {
    title: "Yerliyə dəstək",
    text: "Alışlarınız Azərbaycanın kiçik və orta təsərrüfatlarını birbaşa gücləndirir.",
  },
];

export const ABOUT_DEFAULT_ITEMS: AboutItems = {
  missionTitle: "Missiyamız",
  missionBody:
    "Yerli istehsalı gündəlik ələçatan etmək — fermerlərə sabit satış kanalı, müştərilərə isə etibarlı, təzə və şəffaf qida yolu vermək. Hər sifariş həm keyfiyyəti, həm də kənd təsərrüfatını dəstəkləyir.",
  values: ABOUT_DEFAULT_VALUES,
  farmerTitle: "Fermersiniz?",
  farmerBody:
    "Məhsullarınızı Barakatly-da satışa çıxarın və təsdiqlənmiş müştərilərə birbaşa çatın.",
};

export const ABOUT_DEFAULT = {
  key: ABOUT_KEY,
  title: "Fermerdən süfrəyə — daha təzə, daha yaxın",
  body: "Barakatly yerli fermerlərin məhsullarını şəhər sakinlərinə birbaşa çatdıran marketplace-dir. Məqsədimiz sadədir: təzə qida, ədalətli satış və aydın izləmə.",
  items: ABOUT_DEFAULT_ITEMS,
} as const;
