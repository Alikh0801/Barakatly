-- Seed editable About page content for admin Məzmun panel

insert into public.site_content (key, title, body, items)
values (
  'about',
  'Fermerdən süfrəyə — daha təzə, daha yaxın',
  'Barakatly yerli fermerlərin məhsullarını şəhər sakinlərinə birbaşa çatdıran marketplace-dir. Məqsədimiz sadədir: təzə qida, ədalətli satış və aydın izləmə.',
  '{
    "missionTitle": "Missiyamız",
    "missionBody": "Yerli istehsalı gündəlik ələçatan etmək — fermerlərə sabit satış kanalı, müştərilərə isə etibarlı, təzə və şəffaf qida yolu vermək. Hər sifariş həm keyfiyyəti, həm də kənd təsərrüfatını dəstəkləyir.",
    "values": [
      {
        "title": "Birbaşa fermerdən",
        "text": "Ara vasitəçiləri azaldırıq ki, məhsul daha təzə, qiymət isə daha ədalətli olsun."
      },
      {
        "title": "İzlənəbilən mənşə",
        "text": "Hər sifarişdə təsərrüfat, mənşə və çatdırılma yolu şəffaf qalır."
      },
      {
        "title": "Yerliyə dəstək",
        "text": "Alışlarınız Azərbaycanın kiçik və orta təsərrüfatlarını birbaşa gücləndirir."
      }
    ],
    "farmerTitle": "Fermersiniz?",
    "farmerBody": "Məhsullarınızı Barakatly-da satışa çıxarın və təsdiqlənmiş müştərilərə birbaşa çatın."
  }'::jsonb
)
on conflict (key) do nothing;
