import { Card, CardContent, Box, Typography, Skeleton } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  loading?: boolean;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendLabel,
  color = 'primary',
  loading = false,
}: StatCardProps) {
  const colorMap = {
    primary: 'primary.main',
    success: 'success.main',
    warning: 'warning.main',
    error: 'error.main',
    info: 'info.main',
  };

  const bgColorMap = {
    primary: 'primary.light',
    success: 'success.light',
    warning: 'warning.light',
    error: 'error.light',
    info: 'info.light',
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width={100} height={20} />
              <Skeleton variant="text" width={150} height={40} sx={{ mt: 1 }} />
              <Skeleton variant="text" width={80} height={20} sx={{ mt: 1 }} />
            </Box>
            <Skeleton variant="circular" width={48} height={48} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>
              {value}
            </Typography>
            {(subtitle || trend !== undefined) && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1 }}>
                {trend !== undefined && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      color: trend >= 0 ? 'success.main' : 'error.main',
                    }}
                  >
                    {trend >= 0 ? (
                      <TrendingUpIcon fontSize="small" />
                    ) : (
                      <TrendingDownIcon fontSize="small" />
                    )}
                    <Typography variant="body2" fontWeight={500}>
                      {Math.abs(trend)}%
                    </Typography>
                  </Box>
                )}
                {(subtitle || trendLabel) && (
                  <Typography variant="body2" color="text.secondary">
                    {subtitle || trendLabel}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
          {icon && (
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: `${bgColorMap[color]}20`,
                color: colorMap[color],
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
