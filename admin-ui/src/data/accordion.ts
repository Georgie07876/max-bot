export interface AccordionItem {
  key: string;
  label: string;
}

export interface AccordionSub {
  label: string;
  items?: AccordionItem[];
  sub?: AccordionSub[];
}

export interface AccordionGroup {
  label: string;
  items?: AccordionItem[];
  sub?: AccordionSub[];
}

export const ACCORDION: AccordionGroup[] = [
  {
    label: '☎️ Контакты',
    sub: [
      {
        label: '👩🏻‍🎓 Факультеты',
        items: [
          { key: 'fac_management', label: 'МиП — Менеджмент и предпринимательство' },
          { key: 'fac_trade', label: 'ТД — Торговое дело' },
          { key: 'fac_it', label: 'КТиИБ' },
          { key: 'fac_accounting', label: 'УЭФ — Учётно-экономический' },
          { key: 'fac_economics', label: 'ЭиФ — Экономика и финансы' },
          { key: 'fac_law', label: 'Юридический' },
          { key: 'fac_linguistics', label: 'ЛиЖ — Лингвистика и журналистика' },
        ],
      },
      {
        label: '📈 Кафедры',
        sub: [
          {
            label: 'МиП',
            items: [
              { key: 'dep_mip_hr', label: 'Финансовый и HR менеджмент' },
              { key: 'dep_mip_strat', label: 'Общий и стратегический менедж.' },
              { key: 'dep_mip_gmu', label: 'ГМУ и экономическая безопасность' },
              { key: 'dep_mip_innov', label: 'Инновационный менеджмент' },
              { key: 'dep_mip_anticrisis', label: 'Антикризисное и корп. управление' },
            ],
          },
          {
            label: 'Торгового дела',
            items: [
              { key: 'dep_td_phil', label: 'Философия и культурология' },
              { key: 'dep_td_comm', label: 'Коммерция и логистика' },
              { key: 'dep_td_mark', label: 'Маркетинг и реклама' },
              { key: 'dep_td_customs', label: 'Международная торговля и таможня' },
              { key: 'dep_td_theory', label: 'Экономическая теория' },
              { key: 'dep_td_quality', label: 'Товароведение и управление качеством' },
            ],
          },
          {
            label: 'КТиИБ',
            items: [
              { key: 'dep_ktib_is', label: 'Инф. системы и прикл. информатика' },
              { key: 'dep_ktib_ai', label: 'Прикл. математика и технологии ИИ' },
              { key: 'dep_ktib_it', label: 'Информационные технологии и прогр.' },
              { key: 'dep_ktib_sec', label: 'Информационная безопасность' },
              { key: 'dep_ktib_sport', label: 'Физвоспитание и спорт' },
            ],
          },
          {
            label: 'УЭФ',
            items: [
              { key: 'dep_uef_acc', label: 'Бухгалтерский учёт' },
              { key: 'dep_uef_audit', label: 'Аудит' },
              { key: 'dep_uef_analysis', label: 'Анализ хоз. деятельности' },
              { key: 'dep_uef_stat', label: 'Статистика и эконометрика' },
              { key: 'dep_uef_world', label: 'Мировая экономика и межд. отношения' },
            ],
          },
          {
            label: 'ЭиФ',
            items: [
              { key: 'dep_eif_bank', label: 'Банковское дело' },
              { key: 'dep_eif_fin', label: 'Финансы' },
              { key: 'dep_eif_tax', label: 'Налоги и налогообложение' },
              { key: 'dep_eif_monit', label: 'Финансовый мониторинг' },
              { key: 'dep_eif_reg', label: 'Экономика региона, отраслей и предпр.' },
            ],
          },
          {
            label: 'Юридического',
            items: [
              { key: 'dep_law_civ', label: 'Гражданское право' },
              { key: 'dep_law_hist', label: 'Исторические науки и политология' },
              { key: 'dep_law_const', label: 'Конституционное и муниц. право' },
              { key: 'dep_law_crim_exp', label: 'Судебная экспертиза и криминалистика' },
              { key: 'dep_law_theory', label: 'Теория и история государства и права' },
              { key: 'dep_law_crim', label: 'Уголовное право и криминология' },
              { key: 'dep_law_fin', label: 'Финансовое и административное право' },
              { key: 'dep_law_proc', label: 'Процессуальное право' },
            ],
          },
          {
            label: 'ЛиЖ',
            items: [
              { key: 'dep_lizh_econ', label: 'Ин. языки для экон. специальностей' },
              { key: 'dep_lizh_hum', label: 'Ин. языки для гум. специальностей' },
              { key: 'dep_lizh_journ', label: 'Журналистика' },
              { key: 'dep_lizh_ling', label: 'Лингвистика и межкульт. коммуникация' },
              { key: 'dep_lizh_rus', label: 'Русский язык и культура речи' },
            ],
          },
        ],
      },
      {
        label: '🎓 Институт магистратуры',
        items: [{ key: 'contacts_masters', label: 'Институт магистратуры' }],
      },
      {
        label: '🧠 Аспирантура и докторантура',
        items: [{ key: 'contacts_phd', label: 'Аспирантура и докторантура' }],
      },
      {
        label: '🛠️ Службы университета',
        items: [
          { key: 'srv_accounting', label: 'Управление бухгалтерского учёта' },
          { key: 'srv_hr', label: 'Управление по персоналу' },
          { key: 'srv_admission', label: 'Работа с абитуриентами' },
          { key: 'srv_ic', label: 'Международное сотрудничество' },
          { key: 'srv_education', label: 'Воспитательная работа' },
          { key: 'srv_projects', label: 'Центр проектной деятельности' },
          { key: 'srv_student_bureau', label: 'Студенческое бюро' },
          { key: 'srv_student_trade', label: 'Профсоюзный комитет' },
        ],
      },
      {
        label: '🏠 Общежития',
        items: [{ key: 'contacts_hostels', label: 'Общежития' }],
      },
      {
        label: '📚 Библиотеки',
        items: [
          { key: 'lib_subscriptions', label: 'Абонементы' },
          { key: 'lib_reading_rooms', label: 'Читальные залы' },
          { key: 'lib_e_reading_rooms', label: 'Электронный читальный зал' },
          { key: 'lib_e_education_resources', label: 'Онлайн-ресурсы' },
        ],
      },
    ],
  },
  {
    label: '🏀 Кружки и секции',
    items: [
      { key: 'sec_sport', label: '🏀 Спортивные секции' },
      { key: 'sec_creative', label: '🎸 Творческие кружки' },
      { key: 'sec_science', label: '🎓 Научные конференции' },
      { key: 'sec_patriot', label: '🇷🇺 Патриотический центр' },
    ],
  },
];
