import { Typography } from '@mui/material';
import type { TypographyProps } from '@mui/material';
import { formatCurrency } from '../../utils/calculations';

interface MoneyProps extends Omit<TypographyProps, 'children'> {
  value: number;
  symbol?: string;
  showSign?: boolean;
  colored?: boolean;
}

export default function Money({ value, symbol = '₹', showSign = false, colored = false, ...props }: MoneyProps) {
  const formatted = formatCurrency(Math.abs(value), symbol);
  
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
