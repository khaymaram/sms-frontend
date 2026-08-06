/**
 * Form component size constants.
 * Centralized sizing for all form inputs, selects, buttons, etc.
 */

export type FormSize = 'sm' | 'md' | 'lg';

export const FORM_SIZES = {
  sm: {
    height: 'h-8',
    padding: 'px-3 py-1.5',
    text: 'text-xs',
    rounded: 'rounded-lg'
  },
  md: {
    height: 'h-10',
    padding: 'px-4 py-2.5',
    text: 'text-sm',
    rounded: 'rounded-lg'
  },
  lg: {
    height: 'h-12',
    padding: 'px-5 py-3',
    text: 'text-base',
    rounded: 'rounded-lg'
  }
} as const;

export const getFormSizeClasses = (size: FormSize = 'md') => {
  const config = FORM_SIZES[size];
  return `${config.height} ${config.padding} ${config.text} ${config.rounded}`;
};

export const FORM_BASE_STYLES = `
  w-full border transition-all duration-200
  bg-card text-card-foreground placeholder:text-muted-foreground
  focus:outline-none focus:ring-2 focus:ring-ring focus:ring-opacity-50
  disabled:bg-muted/35 disabled:text-slate-600 disabled:cursor-not-allowed disabled:opacity-90
`;

export const FORM_ERROR_STYLES = `
  border-destructive focus:border-destructive focus:ring-destructive
`;

export const FORM_DEFAULT_STYLES = `
  border-input focus:border-primary focus:ring-primary
`;
