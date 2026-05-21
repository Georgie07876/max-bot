import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

export interface MenuButton {
  id: string; // уникальный идентификатор кнопки
  label: string; // текст на кнопке (с эмодзи)
  type: 'callback' | 'url';
  value: string; // callback_data или URL
}

export interface MenuItem {
  text: string; // текст над кнопками
  parent: string | null; // ID родительского меню (для кнопки "Назад")
  buttons: MenuButton[];
}

export type MenuMap = Record<string, MenuItem>;

@Injectable()
export class MenuService implements OnModuleInit {
  private readonly logger = new Logger(MenuService.name);
  private readonly filePath = path.resolve(process.cwd(), 'data', 'menus.json');
  private menus: MenuMap = {};

  onModuleInit() {
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      if (!fs.existsSync(this.filePath)) {
        fs.writeFileSync(
          this.filePath,
          JSON.stringify(this.getDefaultMenus(), null, 2),
          'utf-8',
        );
        this.logger.log('menus.json создан с дефолтными меню');
      }
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      this.menus = JSON.parse(raw) as MenuMap;
      this.logger.log(`Меню загружены: ${Object.keys(this.menus).length} шт.`);
    } catch (err) {
      this.logger.error('Ошибка загрузки menus.json:', err);
      this.menus = this.getDefaultMenus();
    }
  }

  private saveToDisk(): void {
    fs.writeFileSync(
      this.filePath,
      JSON.stringify(this.menus, null, 2),
      'utf-8',
    );
  }

  // ── ЧТЕНИЕ ────────────────────────────────────────────────────

  getAll(): MenuMap {
    return { ...this.menus };
  }

  getMenu(id: string): MenuItem | null {
    return this.menus[id] ?? null;
  }

  /** Ищет родительское меню для кнопки с указанным value */
  findParentMenuId(callbackValue: string): string | null {
    for (const [menuId, menu] of Object.entries(this.menus)) {
      if (menu.buttons.some((b) => b.value === callbackValue)) {
        return menuId;
      }
    }
    return null;
  }

  // ── МЕНЮ ──────────────────────────────────────────────────────

  updateMenuText(menuId: string, text: string): void {
    if (!this.menus[menuId]) throw new Error(`Меню "${menuId}" не найдено`);
    this.menus[menuId].text = text;
    this.saveToDisk();
  }

  addMenu(id: string, text: string, parent: string | null): void {
    if (this.menus[id]) throw new Error(`Меню "${id}" уже существует`);
    this.menus[id] = { text, parent, buttons: [] };
    this.saveToDisk();
  }

  deleteMenu(id: string): void {
    if (!this.menus[id]) throw new Error(`Меню "${id}" не найдено`);
    delete this.menus[id];
    // Удаляем кнопки из других меню, которые ссылались на это меню
    for (const menu of Object.values(this.menus)) {
      menu.buttons = menu.buttons.filter((b) => b.value !== id);
    }
    this.saveToDisk();
  }

  // ── КНОПКИ ────────────────────────────────────────────────────

  addButton(
    menuId: string,
    label: string,
    type: 'callback' | 'url',
    value: string,
  ): MenuButton {
    if (!this.menus[menuId]) throw new Error(`Меню "${menuId}" не найдено`);
    const btn: MenuButton = { id: randomUUID(), label, type, value };
    this.menus[menuId].buttons.push(btn);
    this.saveToDisk();
    return btn;
  }

  updateButton(
    menuId: string,
    btnId: string,
    label: string,
    type: 'callback' | 'url',
    value: string,
  ): void {
    const menu = this.menus[menuId];
    if (!menu) throw new Error(`Меню "${menuId}" не найдено`);
    const btn = menu.buttons.find((b) => b.id === btnId);
    if (!btn) throw new Error(`Кнопка "${btnId}" не найдена`);
    btn.label = label;
    btn.type = type;
    btn.value = value;
    this.saveToDisk();
  }

  deleteButton(menuId: string, btnId: string): void {
    const menu = this.menus[menuId];
    if (!menu) throw new Error(`Меню "${menuId}" не найдено`);
    menu.buttons = menu.buttons.filter((b) => b.id !== btnId);
    this.saveToDisk();
  }

  moveButton(menuId: string, btnId: string, direction: 'up' | 'down'): void {
    const menu = this.menus[menuId];
    if (!menu) return;
    const idx = menu.buttons.findIndex((b) => b.id === btnId);
    if (idx === -1) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= menu.buttons.length) return;
    [menu.buttons[idx], menu.buttons[newIdx]] = [
      menu.buttons[newIdx],
      menu.buttons[idx],
    ];
    this.saveToDisk();
  }

  // ── ДЕФОЛТНЫЕ МЕНЮ (миграция из bot.buttons.ts) ───────────────
  private getDefaultMenus(): MenuMap {
    return {
      main: {
        text: '👋 Добро пожаловать! Выберите нужный раздел:',
        parent: null,
        buttons: [
          {
            id: 'b1',
            label: '☎️ Контакты',
            type: 'callback',
            value: 'menu_contacts',
          },
          {
            id: 'b2',
            label: '🏀 Кружки и секции',
            type: 'callback',
            value: 'menu_activities',
          },
          {
            id: 'b3',
            label: '🕚 Расписание',
            type: 'url',
            value: 'https://max.ru/vuz_schedule_bot',
          },
          {
            id: 'b4',
            label: '📄 Документы',
            type: 'url',
            value: 'https://rsue.ru/sveden/document/',
          },
          {
            id: 'b5',
            label: '🎪 Мероприятия',
            type: 'url',
            value: 'https://rsue.ru/rasp/',
          },
          {
            id: 'b6',
            label: '❓ Задать вопрос',
            type: 'callback',
            value: 'menu_ask',
          },
        ],
      },
      menu_contacts: {
        text: 'Выберите категорию контактов:',
        parent: 'main',
        buttons: [
          {
            id: 'c1',
            label: '👩🏻‍🎓 Факультеты',
            type: 'callback',
            value: 'contacts_faculties',
          },
          {
            id: 'c2',
            label: '📈 Кафедры',
            type: 'callback',
            value: 'contacts_departments',
          },
          {
            id: 'c3',
            label: '🎓 Институт магистратуры',
            type: 'callback',
            value: 'contacts_masters',
          },
          {
            id: 'c4',
            label: '🧠 Аспирантура и докторантура',
            type: 'callback',
            value: 'contacts_phd',
          },
          {
            id: 'c5',
            label: '🛠️ Службы университета',
            type: 'callback',
            value: 'contacts_services',
          },
          {
            id: 'c6',
            label: '🏠 Общежития',
            type: 'callback',
            value: 'contacts_hostels',
          },
          {
            id: 'c7',
            label: '📚 Библиотеки',
            type: 'callback',
            value: 'contacts_libraries',
          },
        ],
      },
      contacts_faculties: {
        text: 'Выберите факультет:',
        parent: 'menu_contacts',
        buttons: [
          {
            id: 'f1',
            label: '🧑🏼‍🏫 Менеджмента и предпринимательства',
            type: 'callback',
            value: 'fac_management',
          },
          {
            id: 'f2',
            label: '🛃 Торгового дела',
            type: 'callback',
            value: 'fac_trade',
          },
          { id: 'f3', label: '👩🏻‍💻 КТиИБ', type: 'callback', value: 'fac_it' },
          {
            id: 'f4',
            label: '🧮 Учетно-экономический',
            type: 'callback',
            value: 'fac_accounting',
          },
          {
            id: 'f5',
            label: '🤑 Экономики и финансов',
            type: 'callback',
            value: 'fac_economics',
          },
          {
            id: 'f6',
            label: '🧑🏼‍⚖️ Юридический',
            type: 'callback',
            value: 'fac_law',
          },
          {
            id: 'f7',
            label: '📸 Лингвистики и журналистики',
            type: 'callback',
            value: 'fac_linguistics',
          },
        ],
      },
      contacts_departments: {
        text: 'Выберите факультет, чтобы увидеть список его кафедр:',
        parent: 'menu_contacts',
        buttons: [
          {
            id: 'd1',
            label: '🧑🏼‍🏫 МиП',
            type: 'callback',
            value: 'list_dep_mip',
          },
          {
            id: 'd2',
            label: '🛃 Торгового дела',
            type: 'callback',
            value: 'list_dep_td',
          },
          {
            id: 'd3',
            label: '👩🏻‍💻 КТиИБ',
            type: 'callback',
            value: 'list_dep_ktib',
          },
          {
            id: 'd4',
            label: '🧮 УЭФ',
            type: 'callback',
            value: 'list_dep_uef',
          },
          {
            id: 'd5',
            label: '🤑 ЭиФ',
            type: 'callback',
            value: 'list_dep_eif',
          },
          {
            id: 'd6',
            label: '🧑🏼‍⚖️ Юридический',
            type: 'callback',
            value: 'list_dep_law',
          },
          {
            id: 'd7',
            label: '📸 ЛиЖ',
            type: 'callback',
            value: 'list_dep_lizh',
          },
        ],
      },
      list_dep_mip: {
        text: 'Кафедры факультета МиП:',
        parent: 'contacts_departments',
        buttons: [
          {
            id: 'mip1',
            label: '💼 Финансовый и HR менеджмент',
            type: 'callback',
            value: 'dep_mip_hr',
          },
          {
            id: 'mip2',
            label: '📊 Общий и стратегический менеджмент',
            type: 'callback',
            value: 'dep_mip_strat',
          },
          {
            id: 'mip3',
            label: '🏛️ ГМУ и экономическая безопасность',
            type: 'callback',
            value: 'dep_mip_gmu',
          },
          {
            id: 'mip4',
            label: '💡 Инновационный менеджмент',
            type: 'callback',
            value: 'dep_mip_innov',
          },
          {
            id: 'mip5',
            label: '⚡ Антикризисное и корп. управление',
            type: 'callback',
            value: 'dep_mip_anticrisis',
          },
        ],
      },
      list_dep_td: {
        text: 'Кафедры факультета Торгового дела:',
        parent: 'contacts_departments',
        buttons: [
          {
            id: 'td1',
            label: '🧠 Философия и культурология',
            type: 'callback',
            value: 'dep_td_phil',
          },
          {
            id: 'td2',
            label: '🚚 Коммерция и логистика',
            type: 'callback',
            value: 'dep_td_comm',
          },
          {
            id: 'td3',
            label: '📢 Маркетинг и реклама',
            type: 'callback',
            value: 'dep_td_mark',
          },
          {
            id: 'td4',
            label: '🌍 Международная торговля и таможня',
            type: 'callback',
            value: 'dep_td_customs',
          },
          {
            id: 'td5',
            label: '📉 Экономическая теория',
            type: 'callback',
            value: 'dep_td_theory',
          },
          {
            id: 'td6',
            label: '🏷️ Товароведение и управление качеством',
            type: 'callback',
            value: 'dep_td_quality',
          },
        ],
      },
      list_dep_ktib: {
        text: 'Кафедры факультета КТиИБ:',
        parent: 'contacts_departments',
        buttons: [
          {
            id: 'ktib1',
            label: '💻 Информационные системы и прикл. инф.',
            type: 'callback',
            value: 'dep_ktib_is',
          },
          {
            id: 'ktib2',
            label: '🧠 Прикл. математика и технологии ИИ',
            type: 'callback',
            value: 'dep_ktib_ai',
          },
          {
            id: 'ktib3',
            label: '📱 Информационные технологии и прогр.',
            type: 'callback',
            value: 'dep_ktib_it',
          },
          {
            id: 'ktib4',
            label: '🔐 Информационная безопасность',
            type: 'callback',
            value: 'dep_ktib_sec',
          },
          {
            id: 'ktib5',
            label: '⛹️ Физвоспитание и спорт',
            type: 'callback',
            value: 'dep_ktib_sport',
          },
        ],
      },
      list_dep_uef: {
        text: 'Кафедры УЭФ:',
        parent: 'contacts_departments',
        buttons: [
          {
            id: 'uef1',
            label: '💼 Бухгалтерский учёт',
            type: 'callback',
            value: 'dep_uef_acc',
          },
          {
            id: 'uef2',
            label: '🔍 Аудит',
            type: 'callback',
            value: 'dep_uef_audit',
          },
          {
            id: 'uef3',
            label: '📉 Анализ хоз. деятельности',
            type: 'callback',
            value: 'dep_uef_analysis',
          },
          {
            id: 'uef4',
            label: '📊 Статистика и эконометрика',
            type: 'callback',
            value: 'dep_uef_stat',
          },
          {
            id: 'uef5',
            label: '🌍 Мировая экономика и межд. отношения',
            type: 'callback',
            value: 'dep_uef_world',
          },
        ],
      },
      list_dep_eif: {
        text: 'Кафедры ЭиФ:',
        parent: 'contacts_departments',
        buttons: [
          {
            id: 'eif1',
            label: '🏦 Банковское дело',
            type: 'callback',
            value: 'dep_eif_bank',
          },
          {
            id: 'eif2',
            label: '💵 Финансы',
            type: 'callback',
            value: 'dep_eif_fin',
          },
          {
            id: 'eif3',
            label: '📋 Налоги и налогообложение',
            type: 'callback',
            value: 'dep_eif_tax',
          },
          {
            id: 'eif4',
            label: '📊 Финансовый мониторинг',
            type: 'callback',
            value: 'dep_eif_monit',
          },
          {
            id: 'eif5',
            label: '🏭 Экономика региона, отраслей и предпр.',
            type: 'callback',
            value: 'dep_eif_reg',
          },
        ],
      },
      list_dep_law: {
        text: 'Кафедры Юридического факультета:',
        parent: 'contacts_departments',
        buttons: [
          {
            id: 'law1',
            label: '📜 Гражданское право',
            type: 'callback',
            value: 'dep_law_civ',
          },
          {
            id: 'law2',
            label: '🌍 Исторические науки и политология',
            type: 'callback',
            value: 'dep_law_hist',
          },
          {
            id: 'law3',
            label: '🏛️ Конституционное и муниципальное право',
            type: 'callback',
            value: 'dep_law_const',
          },
          {
            id: 'law4',
            label: '🔍 Судебная экспертиза и криминалистика',
            type: 'callback',
            value: 'dep_law_crim_exp',
          },
          {
            id: 'law5',
            label: '📚 Теория и история государства и права',
            type: 'callback',
            value: 'dep_law_theory',
          },
          {
            id: 'law6',
            label: '🚔 Уголовное право и криминология',
            type: 'callback',
            value: 'dep_law_crim',
          },
          {
            id: 'law7',
            label: '📓 Финансовое и административное право',
            type: 'callback',
            value: 'dep_law_fin',
          },
          {
            id: 'law8',
            label: '🧑‍⚖️ Процессуальное право',
            type: 'callback',
            value: 'dep_law_proc',
          },
        ],
      },
      list_dep_lizh: {
        text: 'Кафедры ЛиЖ:',
        parent: 'contacts_departments',
        buttons: [
          {
            id: 'lizh1',
            label: '🌍 Ин. языки для экон. специальностей',
            type: 'callback',
            value: 'dep_lizh_econ',
          },
          {
            id: 'lizh2',
            label: '🗣️ Ин. языки для гум. специальностей',
            type: 'callback',
            value: 'dep_lizh_hum',
          },
          {
            id: 'lizh3',
            label: '📸 Журналистика',
            type: 'callback',
            value: 'dep_lizh_journ',
          },
          {
            id: 'lizh4',
            label: '👥 Лингвистика и межкульт. коммуникация',
            type: 'callback',
            value: 'dep_lizh_ling',
          },
          {
            id: 'lizh5',
            label: '📖 Русский язык и культура речи',
            type: 'callback',
            value: 'dep_lizh_rus',
          },
        ],
      },
      contacts_services: {
        text: 'Службы и управления университета:',
        parent: 'menu_contacts',
        buttons: [
          {
            id: 'srv1',
            label: '💳 Управление бухгалтерского учёта',
            type: 'callback',
            value: 'srv_accounting',
          },
          {
            id: 'srv2',
            label: '👩‍💼 Управление по персоналу',
            type: 'callback',
            value: 'srv_hr',
          },
          {
            id: 'srv3',
            label: '👩‍🏫 Работа с абитуриентами',
            type: 'callback',
            value: 'srv_admission',
          },
          {
            id: 'srv4',
            label: '🌏 Международное сотрудничество',
            type: 'callback',
            value: 'srv_ic',
          },
          {
            id: 'srv5',
            label: '👪 Воспитательная работа',
            type: 'callback',
            value: 'srv_education',
          },
          {
            id: 'srv6',
            label: '💡 Центр проектной деятельности',
            type: 'callback',
            value: 'srv_projects',
          },
          {
            id: 'srv7',
            label: '🗂️ Студенческое бюро',
            type: 'callback',
            value: 'srv_student_bureau',
          },
          {
            id: 'srv8',
            label: '🛃 Профсоюзный комитет',
            type: 'callback',
            value: 'srv_student_trade',
          },
        ],
      },
      contacts_libraries: {
        text: '🕘 **График работы библиотеки РГЭУ (РИНХ)**\n\n- Пн–Чт: 8:30–17:30\n- Пт, Сб: 8:30–16:15\n- Вс: выходной',
        parent: 'menu_contacts',
        buttons: [
          {
            id: 'lib1',
            label: '📚 Абонементы',
            type: 'callback',
            value: 'lib_subscriptions',
          },
          {
            id: 'lib2',
            label: '📖 Читальные залы',
            type: 'callback',
            value: 'lib_reading_rooms',
          },
          {
            id: 'lib3',
            label: '💻 Электронный зал',
            type: 'callback',
            value: 'lib_e_reading_rooms',
          },
          {
            id: 'lib4',
            label: '🌐 Образовательные ресурсы',
            type: 'callback',
            value: 'lib_e_education_resources',
          },
        ],
      },
      menu_activities: {
        text: 'Кружки, секции и центры:',
        parent: 'main',
        buttons: [
          {
            id: 'act1',
            label: '🏀 Спортивные секции',
            type: 'callback',
            value: 'sec_sport',
          },
          {
            id: 'act2',
            label: '🎸 Творческие кружки',
            type: 'callback',
            value: 'sec_creative',
          },
          {
            id: 'act3',
            label: '🎓 Научные конференции',
            type: 'callback',
            value: 'sec_science',
          },
          {
            id: 'act4',
            label: '👩‍🏫 Штаб студ. отрядов (VK)',
            type: 'url',
            value: 'https://vk.com/rso_rsue',
          },
          {
            id: 'act5',
            label: '🇷🇺 Патриотический центр',
            type: 'callback',
            value: 'sec_patriot',
          },
        ],
      },
    };
  }
}
