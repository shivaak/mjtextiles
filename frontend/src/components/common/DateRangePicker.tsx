import { useState } from 'react';
import {
  Box,
  Button,
  Popover,
  Stack,
  Chip,
  TextField,
  Divider,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import dayjs from 'dayjs';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  showPresets?: boolean;
}

const presets = [
  {
    label: 'Today',
    getValue: () => ({
      startDate: dayjs().format('YYYY-MM-DD'),
      endDate: dayjs().format('YYYY-MM-DD'),
    }),
  },
  {
    label: '7 Days',
    getValue: () => ({
      startDate: dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
      endDate: dayjs().format('YYYY-MM-DD'),
    }),
  },
  {
    label: '30 Days',
    getValue: () => ({
      startDate: dayjs().subtract(29, 'day').format('YYYY-MM-DD'),
      endDate: dayjs().format('YYYY-MM-DD'),
    }),
  },
  {
    label: 'This Month',
    getValue: () => ({
      startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
      endDate: dayjs().format('YYYY-MM-DD'),
    }),
  },
  {
    label: 'Last Month',
    getValue: () => ({
      startDate: dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'),
      endDate: dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD'),
    }),
  },
];

export default function DateRangePicker({ value, onChange, showPresets = true }: DateRangePickerProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [tempStart, setTempStart] = useState(value.startDate);
  const [tempEnd, setTempEnd] = useState(value.endDate);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setTempStart(value.startDate);
    setTempEnd(value.endDate);
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleApply = () => {
    onChange({ startDate: tempStart, endDate: tempEnd });
    handleClose();
  };

  const handlePresetClick = (preset: (typeof presets)[0]) => {
    const range = preset.getValue();
    onChange(range);
    handleClose();
  };

  const formatDisplay = () => {
    const start = dayjs(value.startDate);
    const end = dayjs(value.endDate);

    if (start.isSame(end, 'day')) {
      return start.format('MMM D, YYYY');
    }

    if (start.isSame(end, 'year')) {
      return `${start.format('MMM D')} - ${end.format('MMM D, YYYY')}`;
    }

    return `${start.format('MMM D, YYYY')} - ${end.format('MMM D, YYYY')}`;
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<CalendarTodayIcon />}
        onClick={handleClick}
        sx={{ textTransform: 'none' }}
      >
        {formatDisplay()}
      </Button>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Box sx={{ p: 2, minWidth: 300 }}>
          {showPresets && (
            <>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                {presets.map((preset) => (
                  <Chip
                    key={preset.label}
                    label={preset.label}
                    onClick={() => handlePresetClick(preset)}
                    variant="outlined"
                    size="small"
                    sx={{ mb: 1 }}
                  />
                ))}
              </Stack>
              <Divider sx={{ mb: 2 }} />
            </>
          )}

          <Stack spacing={2}>
            <TextField
              label="Start Date"
              type="date"
              value={tempStart}
              onChange={(event) => setTempStart(event.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Date"
              type="date"
              value={tempEnd}
              onChange={(event) => setTempEnd(event.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button type="button" size="small" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="button" size="small" variant="contained" onClick={handleApply}>
                Apply
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Popover>
    </>
  );
}
