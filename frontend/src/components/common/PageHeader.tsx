import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { ReactNode } from 'react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  action?: ReactNode;
}

export default function PageHeader({ title, subtitle, breadcrumbs, action }: PageHeaderProps) {
  return (
    <Box sx={{ mb: 3 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          sx={{ mb: 1 }}
        >
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return isLast ? (
              <Typography key={index} color="text.primary" variant="body2">
                {item.label}
              </Typography>
            ) : (
              <Link
                key={index}
                component={RouterLink}
                to={item.href || '#'}
                underline="hover"
                color="inherit"
                variant="body2"
              >
                {item.label}
              </Link>
            );
          })}
        </Breadcrumbs>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight={600}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {action && <Box>{action}</Box>}
      </Box>
    </Box>
  );
}
