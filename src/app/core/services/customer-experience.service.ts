import { Injectable } from '@angular/core';
import { Settings, CustomerExperience } from '../models';

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  buttonStyle: 'rounded' | 'square' | 'pill' | 'floating';
  cardRadius: 'small' | 'medium' | 'large';
  typographyStyle: 'Modern Sans' | 'Classic Serif' | 'Playful Rounded' | 'Elegant Editorial';
  cardShadow: 'none' | 'subtle' | 'shadow';
}

@Injectable({ providedIn: 'root' })
export class CustomerExperienceService {
  // Presets mapping definitions
  private presets: Record<string, ThemeConfig> = {
    'Classic Restaurant': {
      primaryColor: '#b81d24',
      secondaryColor: '#451a03',
      accentColor: '#d97706',
      buttonStyle: 'rounded',
      cardRadius: 'medium',
      typographyStyle: 'Classic Serif',
      cardShadow: 'subtle'
    },
    'Modern Cafe': {
      primaryColor: '#0f766e',
      secondaryColor: '#1e293b',
      accentColor: '#f43f5e',
      buttonStyle: 'pill',
      cardRadius: 'large',
      typographyStyle: 'Modern Sans',
      cardShadow: 'shadow'
    },
    'Luxury Dining': {
      primaryColor: '#1e1b4b',
      secondaryColor: '#111827',
      accentColor: '#b45309',
      buttonStyle: 'square',
      cardRadius: 'small',
      typographyStyle: 'Elegant Editorial',
      cardShadow: 'none'
    },
    'Fast Food': {
      primaryColor: '#ea580c',
      secondaryColor: '#eab308',
      accentColor: '#16a34a',
      buttonStyle: 'pill',
      cardRadius: 'large',
      typographyStyle: 'Playful Rounded',
      cardShadow: 'shadow'
    },
    'Minimal': {
      primaryColor: '#18181b',
      secondaryColor: '#71717a',
      accentColor: '#27272a',
      buttonStyle: 'square',
      cardRadius: 'small',
      typographyStyle: 'Modern Sans',
      cardShadow: 'none'
    }
  };

  /**
   * Get the active visual configuration by merging presets and custom settings.
   */
  resolveThemeConfig(settings: Settings | null, cx: CustomerExperience | null): ThemeConfig {
    const defaultTheme: ThemeConfig = {
      primaryColor: '#E53935',
      secondaryColor: '#424242',
      accentColor: '#FFC107',
      buttonStyle: 'rounded',
      cardRadius: 'medium',
      typographyStyle: 'Modern Sans',
      cardShadow: 'subtle'
    };

    if (!settings) return defaultTheme;

    // Check if preset is specified and exists
    const presetName = settings.themePreset;
    if (presetName && presetName !== 'Custom' && this.presets[presetName]) {
      return {
        ...this.presets[presetName],
        // Override with custom shadow if specifically defined in cx
        cardShadow: cx?.cardShadow || this.presets[presetName].cardShadow
      };
    }

    // Otherwise use custom config
    return {
      primaryColor: settings.primaryColor || defaultTheme.primaryColor,
      secondaryColor: settings.secondaryColor || defaultTheme.secondaryColor,
      accentColor: settings.accentColor || defaultTheme.accentColor,
      buttonStyle: (settings.buttonStyle as any) || defaultTheme.buttonStyle,
      cardRadius: settings.cardRadius || defaultTheme.cardRadius,
      typographyStyle: settings.typographyStyle || defaultTheme.typographyStyle || 'Modern Sans',
      cardShadow: cx?.cardShadow || defaultTheme.cardShadow
    };
  }

  /**
   * Generates style variables dictionary to bind via ngStyle.
   */
  getStyleVariables(settings: Settings | null, cx: CustomerExperience | null): Record<string, string> {
    const theme = this.resolveThemeConfig(settings, cx);

    // Map buttonStyle radius
    let btnRadius = '12px';
    if (theme.buttonStyle === 'pill') btnRadius = '50px';
    else if (theme.buttonStyle === 'square') btnRadius = '0px';
    else if (theme.buttonStyle === 'rounded') btnRadius = '8px';
    else if (theme.buttonStyle === 'floating') btnRadius = '30px';

    // Map cardRadius radius
    let cardRadius = '16px';
    if (theme.cardRadius === 'small') cardRadius = '8px';
    else if (theme.cardRadius === 'medium') cardRadius = '14px';
    else if (theme.cardRadius === 'large') cardRadius = '24px';

    // Map font family
    let fontFamily = "'Inter', sans-serif";
    if (theme.typographyStyle === 'Modern Sans') fontFamily = "'Outfit', sans-serif";
    else if (theme.typographyStyle === 'Classic Serif') fontFamily = "'Playfair Display', serif";
    else if (theme.typographyStyle === 'Playful Rounded') fontFamily = "'Quicksand', sans-serif";
    else if (theme.typographyStyle === 'Elegant Editorial') fontFamily = "'Lora', serif";

    // Map cardShadow
    let shadow = '0 4px 20px rgba(0,0,0,0.05)';
    if (theme.cardShadow === 'none') shadow = 'none';
    else if (theme.cardShadow === 'subtle') shadow = '0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)';
    else if (theme.cardShadow === 'shadow') shadow = '0 10px 30px rgba(0,0,0,0.08), 0 6px 12px rgba(0,0,0,0.03)';

    // Map imageStyle radius
    const imgStyle = cx?.imageStyle || 'rounded';
    let imageRadius = cardRadius;
    if (imgStyle === 'square') imageRadius = '0px';
    else if (imgStyle === 'circle') imageRadius = '50%';

    return {
      '--primary-color': theme.primaryColor,
      '--secondary-color': theme.secondaryColor,
      '--accent-color': theme.accentColor,
      '--btn-radius': btnRadius,
      '--card-radius': cardRadius,
      '--font-family': fontFamily,
      '--card-shadow': shadow,
      '--image-radius': imageRadius
    };
  }
}
