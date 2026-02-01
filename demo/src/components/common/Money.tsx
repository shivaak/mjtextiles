// Money component for formatted currency display

import { Typography } from '@mui/material';
import type { TypographyProps } from '@mui/material';
import { formatCurrency } from '../../domain/calculations';
import { getSettings } from '../../data/repositories';

interface MoneyProps extends Omit<TypographyProps, 'children'> {
  value: number;
  showSign?: boolean;
  colored?: boolean;
}

export function Money({ value, showSign = false, colored = false, ...props }: MoneyProps) {
  const settings = getSettings();
  const formatted = formatCurrency(Math.abs(value), settings.currencySymbol);
  
  let display = formatted;
  if (showSign && value !== 0) {
    display = value > 0 ? `+${formatted}` : `-${formatted}`;
  } else if (value < 0) {
    display = `-${formatted}`;
  }

  let color: TypographyProps['color'] = undefined;
  if (colored) {
    if (value > 0) color = 'success.main';
    else if (value < 0) color = 'error.main';
  }

  return (
    <Typography component="span" color={color} {...props}>
      {display}
    </Typography>
  );
}

// Simple format function for inline use
export function useCurrency() {
  const settings = getSettings();
  
  return {
    format: (value: number) => formatCurrency(value, settings.currencySymbol),
    symbol: settings.currencySymbol,
  };
}
