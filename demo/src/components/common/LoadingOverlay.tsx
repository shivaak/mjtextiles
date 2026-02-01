// LoadingOverlay component for page loading states

import { Box, CircularProgress, Typography, Skeleton, Card, CardContent } from '@mui/material';

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
        gap: 2,
      }}
    >
      <CircularProgress />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}

// Table skeleton for loading data grids
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" width={`${100 / columns}%`} height={40} />
        ))}
      </Box>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <Box key={rowIndex} sx={{ display: 'flex', gap: 2, mb: 1 }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} variant="text" width={`${100 / columns}%`} height={32} />
          ))}
        </Box>
      ))}
    </Box>
  );
}

// Card skeleton for dashboard stats
export function StatCardSkeleton() {
  return (
    <Card>
      <CardContent>
        <Skeleton variant="text" width={100} height={20} />
        <Skeleton variant="text" width={150} height={40} sx={{ mt: 1 }} />
        <Skeleton variant="text" width={80} height={20} sx={{ mt: 1 }} />
      </CardContent>
    </Card>
  );
}

// Chart skeleton
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <Skeleton variant="rectangular" width="100%" height={height} sx={{ borderRadius: 1 }} />
  );
}
