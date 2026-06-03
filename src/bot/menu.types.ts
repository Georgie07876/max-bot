export interface MenuButton {
  id: string;
  label: string;
  type: 'callback' | 'url';
  value: string;
}

export interface MenuItem {
  text: string;
  parent: string | null;
  buttons: MenuButton[];
}

export type MenuMap = Record<string, MenuItem>;
