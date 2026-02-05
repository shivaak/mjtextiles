import { Box, Card, CardContent, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface PagePlaceholderProps {
  title: string;
  description: string;
  icon: ReactNode;
}

export default function PagePlaceholder({ title, description, icon }: PagePlaceholderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 200px)',
      }}
    >
      <Card
        sx={{
          maxWidth: 500,
          textAlign: 'center',
          p: 4,
          boxShadow: 3,
        }}
      >
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 3,
              color: 'primary.main',
              '& > *': {
                fontSize: 80,
              },
            }}
          >
            {icon}
          </Box>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            {title}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {description}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              mt: 3,
              color: 'primary.main',
              fontWeight: 500,
            }}
          >
            Coming Soon
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
