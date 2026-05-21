import { Keyboard } from '@maxhub/max-bot-api';

/**
 * Класс для генерации кнопок бота.
 * Все методы возвращают массив массивов кнопок (двумерный массив),
 * который затем передается в Keyboard.inlineKeyboard()
 */
export type KeyboardButtons = Parameters<typeof Keyboard.inlineKeyboard>[0];
export type Button = KeyboardButtons[number][number];

export class BotButtons {
  /**
   * УРОВЕНЬ 0: Главное меню
   */
  static mainMenu(): KeyboardButtons {
    return [
      [Keyboard.button.callback('☎️ Контакты', 'menu_contacts')],
      [Keyboard.button.callback('🏀 Кружки и секции', 'menu_activities')],
      [
        Keyboard.button.link(
          '🕚 Расписание',
          'https://max.ru/vuz_schedule_bot',
        ),
      ],
      [
        Keyboard.button.link(
          '📄 Документы',
          'https://rsue.ru/sveden/document/',
        ),
      ],
      [Keyboard.button.link('🎪 Мероприятия', 'https://rsue.ru/rasp/')],
      [Keyboard.button.callback('❓ Задать вопрос', 'menu_ask')],
    ];
  }

  /**
   * УРОВЕНЬ 1: Раздел контактов
   */
  static contactsMenu(): KeyboardButtons {
    return [
      [Keyboard.button.callback('👩🏻‍🎓 Факультеты', 'contacts_faculties')],
      [Keyboard.button.callback('📈 Кафедры', 'contacts_departments')],
      [
        Keyboard.button.callback(
          '🎓 Институт магистратуры',
          'contacts_masters',
        ),
      ],
      [
        Keyboard.button.callback(
          '🧠 Аспирантура и докторантура',
          'contacts_phd',
        ),
      ],
      [Keyboard.button.callback('🛠️ Службы университета', 'contacts_services')],
      [Keyboard.button.callback('🏠 Общежития', 'contacts_hostels')],
      [Keyboard.button.callback('📚 Библиотеки', 'contacts_libraries')],
      ...this.backToStart(),
    ];
  }

  /**
   * УРОВЕНЬ 2: Выбор факультета для получения общей инфо
   */
  static facultyMenu(): KeyboardButtons {
    return [
      [
        Keyboard.button.callback(
          '🧑🏼‍🏫 Менеджмента и предпринимательства',
          'fac_management',
        ),
      ],
      [Keyboard.button.callback('🛃 Торгового дела', 'fac_trade')],
      [Keyboard.button.callback('👩🏻‍💻 КТиИБ', 'fac_it')],
      [Keyboard.button.callback('🧮 Учетно-экономический', 'fac_accounting')],
      [Keyboard.button.callback('🤑 Экономики и финансов', 'fac_economics')],
      [Keyboard.button.callback('🧑🏼‍⚖️ Юридический', 'fac_law')],
      [
        Keyboard.button.callback(
          '📸 Лингвистики и журналистики',
          'fac_linguistics',
        ),
      ],
      ...this.goBack('menu_contacts'),
      ...this.backToStart(),
    ];
  }

  /**
   * УРОВЕНЬ 2: Выбор факультета для перехода к списку КАФЕДР
   */
  static departmentsMenu(): KeyboardButtons {
    return [
      [
        Keyboard.button.callback(
          '🧑🏼‍🏫 Менеджмента и предпринимательства',
          'list_dep_mip',
        ),
      ],
      [Keyboard.button.callback('🛃 Торгового дела', 'list_dep_td')],
      [Keyboard.button.callback('👩🏻‍💻 Кафедры КТиИБ', 'list_dep_ktib')],
      [Keyboard.button.callback('🧮 Учетно-экономический', 'list_dep_uef')],
      [
        Keyboard.button.callback(
          '🤑 Кафедры Экономики и финансов',
          'list_dep_eif',
        ),
      ],
      [Keyboard.button.callback('🧑🏼‍⚖️ Кафедры Юридический', 'list_dep_law')],
      [
        Keyboard.button.callback(
          '📸 Кафедры Лингвистики и журналистики',
          'list_dep_lizh',
        ),
      ],
      ...this.goBack('menu_contacts'),
      ...this.backToStart(),
    ];
  }

  /**
   * УРОВЕНЬ 2.5: Списки кафедр по конкретным факультетам
   */
  static mipDepartmentsMenu(): KeyboardButtons {
    return [
      [Keyboard.button.callback('💰 Финансовый и HR менеджмент', 'dep_mip_hr')],
      [
        Keyboard.button.callback(
          '🗺️ Общий и стратегический менеджмент',
          'dep_mip_strat',
        ),
      ],
      [
        Keyboard.button.callback(
          '🛡️ ГМУ и экономическая безопасность',
          'dep_mip_gmu',
        ),
      ],
      [
        Keyboard.button.callback(
          '📈 Инновационный менеджмент и предпр.',
          'dep_mip_innov',
        ),
      ],
      [
        Keyboard.button.callback(
          '🛠️ Антикризисное и корп. управление',
          'dep_mip_anticrisis',
        ),
      ],
      ...this.goBack('contacts_departments'),
      ...this.backToStart(),
    ];
  }

  static tdDepartmentsMenu(): KeyboardButtons {
    return [
      [Keyboard.button.callback('🎭 Философии и культурологии', 'dep_td_phil')],
      [Keyboard.button.callback('🚚 Коммерции и логистики', 'dep_td_comm')],
      [Keyboard.button.callback('🎯 Маркетинга и рекламы', 'dep_td_mark')],
      [
        Keyboard.button.callback(
          '🛳️ Международной торговли и тамож. дела',
          'dep_td_customs',
        ),
      ],
      [Keyboard.button.callback('📊 Экономической теории', 'dep_td_theory')],
      [
        Keyboard.button.callback(
          '🛒 Товароведения и управления качеством',
          'dep_td_quality',
        ),
      ],
      ...this.goBack('contacts_departments'),
      ...this.backToStart(),
    ];
  }

  static ktibDepartmentsMenu(): KeyboardButtons {
    return [
      [
        Keyboard.button.callback(
          '💻 Информационных систем и прикл. инф.',
          'dep_ktib_is',
        ),
      ],
      [
        Keyboard.button.callback(
          '🧠 Прикл. математики и технологий ИИ',
          'dep_ktib_ai',
        ),
      ],
      [
        Keyboard.button.callback(
          '📱 Инф. технологий и программирования',
          'dep_ktib_it',
        ),
      ],
      [
        Keyboard.button.callback(
          '🔐 Информационной безопасности',
          'dep_ktib_sec',
        ),
      ],
      [
        Keyboard.button.callback(
          '⛹️‍♀️ Физ. воспитания, спорта и туризма',
          'dep_ktib_sport',
        ),
      ],
      ...this.goBack('contacts_departments'),
      ...this.backToStart(),
    ];
  }

  static uefDepartmentsMenu(): KeyboardButtons {
    return [
      [Keyboard.button.callback('💼 Бухгалтерского учета', 'dep_uef_acc')],
      [Keyboard.button.callback('🔍 Аудита', 'dep_uef_audit')],
      [
        Keyboard.button.callback(
          '📉 Анализа хоз. деятельности и прогноз.',
          'dep_uef_analysis',
        ),
      ],
      [
        Keyboard.button.callback(
          '📘 Статистики, эконометрики и оценки рисков',
          'dep_uef_stat',
        ),
      ],
      [
        Keyboard.button.callback(
          '🌍 Мировой экономики и межд. отношений',
          'dep_uef_world',
        ),
      ],
      ...this.goBack('contacts_departments'),
      ...this.backToStart(),
    ];
  }

  static eifDepartmentsMenu(): KeyboardButtons {
    return [
      [Keyboard.button.callback('🏦 Банковского дела', 'dep_eif_bank')],
      [Keyboard.button.callback('💵 Финансов', 'dep_eif_fin')],
      [Keyboard.button.callback('📋 Налоги и налогообложение', 'dep_eif_tax')],
      [
        Keyboard.button.callback(
          '📊 Фин. мониторинга и фин. рынков',
          'dep_eif_monit',
        ),
      ],
      [
        Keyboard.button.callback(
          '🏭 Экономики региона, отраслей и предпр.',
          'dep_eif_reg',
        ),
      ],
      ...this.goBack('contacts_departments'),
      ...this.backToStart(),
    ];
  }

  static lawDepartmentsMenu(): KeyboardButtons {
    return [
      [Keyboard.button.callback('📜 Гражданского права', 'dep_law_civ')],
      [
        Keyboard.button.callback(
          '🌍 Исторических наук и политологии',
          'dep_law_hist',
        ),
      ],
      [
        Keyboard.button.callback(
          '🏛️ Конституционного и муниц. права',
          'dep_law_const',
        ),
      ],
      [
        Keyboard.button.callback(
          '🔍 Судебной экспертизы и криминалистики',
          'dep_law_crim_exp',
        ),
      ],
      [
        Keyboard.button.callback(
          '📚 Теории и истории государства и права',
          'dep_law_theory',
        ),
      ],
      [
        Keyboard.button.callback(
          '🚔 Уголовного права и криминологии',
          'dep_law_crim',
        ),
      ],
      [
        Keyboard.button.callback(
          '📓 Финансового и админ. права',
          'dep_law_fin',
        ),
      ],
      [Keyboard.button.callback('🧑‍⚖️ Процессуального права', 'dep_law_proc')],
      ...this.goBack('contacts_departments'),
      ...this.backToStart(),
    ];
  }

  static lizhDepartmentsMenu(): KeyboardButtons {
    return [
      [
        Keyboard.button.callback(
          '🌍 Ин. языков для эконом. специальностей',
          'dep_lizh_econ',
        ),
      ],
      [
        Keyboard.button.callback(
          '🗣️ Ин. языков для гуман. специальностей',
          'dep_lizh_hum',
        ),
      ],
      [Keyboard.button.callback('📸 Журналистики', 'dep_lizh_journ')],
      [
        Keyboard.button.callback(
          '👥 Лингвистики и межкультурной комм.',
          'dep_lizh_ling',
        ),
      ],
      [
        Keyboard.button.callback(
          '📖 Русского языка и культуры речи',
          'dep_lizh_rus',
        ),
      ],
      ...this.goBack('contacts_departments'),
      ...this.backToStart(),
    ];
  }

  /**
   * ДРУГИЕ РАЗДЕЛЫ
   */
  static universityServicesMenu(): KeyboardButtons {
    return [
      [
        Keyboard.button.callback(
          '💳 Управление бухгалтерского и налогового учета',
          'srv_accounting',
        ),
      ],
      [
        Keyboard.button.callback(
          '👩‍💼 Управление по работе с персоналом и кадровой политике',
          'srv_hr',
        ),
      ],
      [
        Keyboard.button.callback(
          '👩‍🏫 Управление по работе с абитуриентами и развитию карьеры',
          'srv_admission',
        ),
      ],
      [
        Keyboard.button.callback(
          '🌏 Управление международного сотрудничества',
          'srv_ic',
        ),
      ],
      [
        Keyboard.button.callback(
          '👪 Управление по воспитательной работе и поддержке студенческих инициатив',
          'srv_education',
        ),
      ],
      [
        Keyboard.button.callback(
          '💡 Центр проектной деятельности',
          'srv_projects',
        ),
      ],
      [Keyboard.button.callback('🗂️ Студенческое бюро', 'srv_student_bureau')],
      [
        Keyboard.button.callback(
          '🛃 Профсоюзный комитет обучающихся',
          'srv_student_trade',
        ),
      ],
      ...this.goBack('menu_contacts'),
      ...this.backToStart(),
    ];
  }

  static libraryMenu(): KeyboardButtons {
    return [
      [Keyboard.button.callback('📚 Абонементы', 'lib_subscriptions')],
      [Keyboard.button.callback('📖 Читальные залы', 'lib_reading_rooms')],
      [Keyboard.button.callback('💻 Электронный зал', 'lib_e_reading_rooms')],
      //ДОДЕЛАТЬ
      [
        Keyboard.button.callback(
          '🌐 Образовательные ресурсы',
          'lib_e_education_resources',
        ),
      ],

      ...this.goBack('menu_contacts'),
      ...this.backToStart(),
    ];
  }

  static sectionsMenu(): KeyboardButtons {
    return [
      [Keyboard.button.callback('🏀 Спортивные секции', 'sec_sport')],
      [Keyboard.button.callback('🎸 Творческие кружки', 'sec_creative')],
      [Keyboard.button.callback('🎓 Научные конференции', 'sec_science')],
      [
        Keyboard.button.link(
          '👩‍🏫 Штаб студенческих отрядов (VK)',
          'https://vk.com/rso_rsue',
        ),
      ],
      [Keyboard.button.callback('🇷🇺 Патриотический центр', 'sec_patriot')],
      ...this.backToStart(),
    ];
  }

  /**
   * ХЕЛПЕРЫ НАВИГАЦИИ
   */
  static goBack(callback: string): KeyboardButtons {
    return [[Keyboard.button.callback('↩️ Назад', callback)]];
  }

  static backToStart(): KeyboardButtons {
    return [[Keyboard.button.callback('⬅️ В начало', 'nav_start')]];
  }
}
