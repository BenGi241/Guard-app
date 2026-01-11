
'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format, parse } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Download, Calendar as CalendarIcon } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useGuardDutyStore } from '@/lib/state';

export default function ExportPage() {
  const { toast } = useToast();
  const { reservations } = useGuardDutyStore();
  const [exportStartDate, setExportStartDate] = useState<Date | undefined>();
  const [exportEndDate, setExportEndDate] = useState<Date | undefined>();

  const handleExport = () => {
    if (!exportStartDate || !exportEndDate) {
      toast({
        variant: 'destructive',
        title: 'Date range required',
        description: 'Please select a start and end date for the export.',
      });
      return;
    }

    if (exportEndDate < exportStartDate) {
      toast({
        variant: 'destructive',
        title: 'Invalid date range',
        description: 'End date cannot be before start date.',
      });
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Name,Personal ID,Date\n';

    Object.entries(reservations).forEach(([dateStr, reservist]) => {
      // The date string is already 'yyyy-MM-dd', which is what parse expects
      const reservationDate = parse(dateStr, 'yyyy-MM-dd', new Date());
      if (
        reservationDate >= exportStartDate &&
        reservationDate <= exportEndDate
      ) {
        csvContent += `${reservist.user.name},${reservist.userId},${dateStr}\n`;
      }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'guard_duty_schedule.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Export Successful',
      description: `Reservations from ${format(
        exportStartDate,
        'PPP'
      )} to ${format(exportEndDate, 'PPP')} have been exported.`,
    });
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 rounded-lg border bg-card p-4 text-card-foreground shadow-sm sm:flex-row sm:justify-center">
        <h3 className="text-lg font-medium">ייצוא שמירות</h3>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn(
                  'w-[240px] justify-start text-left font-normal',
                  !exportStartDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {exportStartDate ? (
                  format(exportStartDate, 'PPP')
                ) : (
                  <span>תאריך התחלה</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={exportStartDate}
                onSelect={setExportStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn(
                  'w-[240px] justify-start text-left font-normal',
                  !exportEndDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {exportEndDate ? (
                  format(exportEndDate, 'PPP')
                ) : (
                  <span>תאריך סיום</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={exportEndDate}
                onSelect={setExportEndDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            ייצוא ל-CSV
          </Button>
        </div>
      </div>
    </div>
  );
}
