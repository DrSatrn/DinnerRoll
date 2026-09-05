import type { AppTheme } from '../domain/models';

export interface ThemePalette {
  id: AppTheme;
  name: string;
  subtitle: string;
  source: string;
  previewColors: {
    bg: string;
    surface: string;
    accent: string;
    text: string;
  };
  colors: {
    bgApp: string;
    bgSurface: string;
    bgSubtle: string;
    bgMuted: string;
    borderLight: string;
    borderMedium: string;
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    accentPrimary: string;
    accentPrimaryHover: string;
    accentPrimaryLight: string;
    accentSecondary: string;
    accentSecondaryLight: string;
    accentHighlight: string;
    headerBg: string;
    headerText: string;
    cardBg: string;
    cardBorder: string;
  };
}

export const THEMES: Record<AppTheme, ThemePalette> = {
  'warm-terracotta': {
    id: 'warm-terracotta',
    name: 'Bistro Terracotta',
    subtitle: 'Warm kitchen paper & terracotta',
    source: 'Bistro & Stone open-source palette',
    previewColors: {
      bg: '#FAF8F5',
      surface: '#FFFFFF',
      accent: '#B85324',
      text: '#2D2A26'
    },
    colors: {
      bgApp: '#FAF8F5',
      bgSurface: '#FFFFFF',
      bgSubtle: '#F3EFE9',
      bgMuted: '#EAE5DC',
      borderLight: '#E8E3DC',
      borderMedium: '#D5CEBF',
      textPrimary: '#2D2A26',
      textSecondary: '#6B655D',
      textTertiary: '#968F84',
      accentPrimary: '#B85324',
      accentPrimaryHover: '#A3451A',
      accentPrimaryLight: '#FBF0E8',
      accentSecondary: '#386150',
      accentSecondaryLight: '#EBF2EE',
      accentHighlight: '#B45309',
      headerBg: '#2D2A26',
      headerText: '#FFFFFF',
      cardBg: '#FFFFFF',
      cardBorder: '#E8E3DC'
    }
  },
  'nordic-slate': {
    id: 'nordic-slate',
    name: 'Nordic Slate',
    subtitle: 'Crisp arctic frost & slate',
    source: 'Nord design system open palette',
    previewColors: {
      bg: '#ECEFF4',
      surface: '#FFFFFF',
      accent: '#5E81AC',
      text: '#2E3440'
    },
    colors: {
      bgApp: '#ECEFF4',
      bgSurface: '#FFFFFF',
      bgSubtle: '#E5E9F0',
      bgMuted: '#D8DEE9',
      borderLight: '#D8DEE9',
      borderMedium: '#4C566A',
      textPrimary: '#2E3440',
      textSecondary: '#4C566A',
      textTertiary: '#7B88A1',
      accentPrimary: '#5E81AC',
      accentPrimaryHover: '#4C6F98',
      accentPrimaryLight: '#EBF1F8',
      accentSecondary: '#8FBCBB',
      accentSecondaryLight: '#EAF3F3',
      accentHighlight: '#D08770',
      headerBg: '#2E3440',
      headerText: '#ECEFF4',
      cardBg: '#FFFFFF',
      cardBorder: '#D8DEE9'
    }
  },
  'midnight-diner': {
    id: 'midnight-diner',
    name: 'Midnight Diner',
    subtitle: 'Deep velvet & glowing peach amber',
    source: 'Catppuccin Mocha & Tokyo Night',
    previewColors: {
      bg: '#181825',
      surface: '#1E1E2E',
      accent: '#F5A97F',
      text: '#CDD6F4'
    },
    colors: {
      bgApp: '#181825',
      bgSurface: '#1E1E2E',
      bgSubtle: '#252538',
      bgMuted: '#313244',
      borderLight: '#313244',
      borderMedium: '#45475A',
      textPrimary: '#CDD6F4',
      textSecondary: '#A6ADC8',
      textTertiary: '#7F849C',
      accentPrimary: '#F5A97F',
      accentPrimaryHover: '#EE99A0',
      accentPrimaryLight: '#2D232C',
      accentSecondary: '#89DCEB',
      accentSecondaryLight: '#1C2936',
      accentHighlight: '#CBA6F7',
      headerBg: '#11111B',
      headerText: '#CDD6F4',
      cardBg: '#1E1E2E',
      cardBorder: '#313244'
    }
  },
  'olive-grove': {
    id: 'olive-grove',
    name: 'Olive & Brass',
    subtitle: 'Earthy botanical parchment & brass',
    source: 'Gruvbox Light & Botanical Earth',
    previewColors: {
      bg: '#F4EDE0',
      surface: '#FDFBF7',
      accent: '#4F772D',
      text: '#3C3836'
    },
    colors: {
      bgApp: '#F4EDE0',
      bgSurface: '#FDFBF7',
      bgSubtle: '#EBDDC8',
      bgMuted: '#DECBB3',
      borderLight: '#D6C4AA',
      borderMedium: '#A89984',
      textPrimary: '#3C3836',
      textSecondary: '#504945',
      textTertiary: '#7C6F64',
      accentPrimary: '#4F772D',
      accentPrimaryHover: '#3E5F23',
      accentPrimaryLight: '#EEF4E8',
      accentSecondary: '#B57614',
      accentSecondaryLight: '#FBF2DD',
      accentHighlight: '#AF3A03',
      headerBg: '#3C3836',
      headerText: '#FBF1C7',
      cardBg: '#FDFBF7',
      cardBorder: '#D6C4AA'
    }
  }
};

export const THEME_LIST: ThemePalette[] = Object.values(THEMES);

export function getThemePalette(themeId?: AppTheme): ThemePalette {
  if (themeId && THEMES[themeId]) {
    return THEMES[themeId];
  }
  return THEMES['warm-terracotta'];
}

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b];
}
