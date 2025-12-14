import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext: React.ReactNode;
  icon: React.ElementType;
  gradient: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtext, icon: Icon, gradient }) => {
  const theme = useTheme();
  return (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
           <Box sx={{ flexGrow: 1, minWidth: 0, pr: 1 }}>
              <Typography variant="body2" color="text.secondary" fontWeight="medium" noWrap>{title}</Typography>
              <Typography variant="h4" fontWeight="bold" sx={{ color: 'text.primary', wordBreak: 'break-word' }}>{value}</Typography>
           </Box>
           <Box
            sx={{
                p: 1.5,
                borderRadius: theme.shape.borderRadius * 3,
                background: gradient,
                color: 'white',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                flexShrink: 0,
            }}>
              <Icon size={24} />
           </Box>
        </Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {subtext}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default React.memo(StatCard);