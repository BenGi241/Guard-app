
'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  format,
  isSameDay,
  startOfToday,
  eachDayOfInterval,
  differenceInDays,
} from 'date-fns';
import { he } from 'date-fns/locale';
import {
  useGuardDutyStore,
  type User,
  type Reservation,
  useSyncUser,
} from '@/lib/state';
import type { DateRange } from 'react-day-picker';

export default function GuardDutyCalendar() {
  const { currentUser, loading: userLoading } = useSyncUser();
  const { reservations, addReservations } = useGuardDutyStore();

  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [selectedReservist, setSelectedReservist] = useState<User | null>(
    null
  );
  const { toast } = useToast();
  const [month, setMonth] = useState(new Date());

  if (userLoading || !currentUser) return <div>Loading calendar...</div>;

  const myReservedDays = Object.values(reservations)
    .filter(reservist => reservist.userId === currentUser.id)
    .map(reservist => new Date(reservist.id.replace(/-/g, '/')));

  const otherReservedDays = Object.values(reservations)
    .filter(reservist => reservist.userId !== currentUser.id)
    .map(reservist => new Date(reservist.id.replace(/-/g, '/')));

  const allReservedDays = [...myReservedDays, ...otherReservedDays];

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    const isReserved = allReservedDays.some(reservedDay =>
      isSameDay(date, reservedDay)
    );

    if (isReserved) {
      const dateString = format(date, 'yyyy-MM-dd');
      const reservation = reservations[dateString];
      if (reservation && reservation.user) {
        setSelectedReservist(reservation.user);
        setIsInfoDialogOpen(true);
      }
    }
  };

  const handleRangeSelect = (range: DateRange | undefined) => {
    // If user clicks a date before the start date, start a new selection
    if (range?.from && range.to && range.to < range.from) {
      setSelectedRange({ from: range.to, to: undefined });
      return;
    }
    
    // If a full range is selected, check for overlaps
    if (range?.from && range.to) {
       if (differenceInDays(range.to, range.from) < 1) {
          toast({
            variant: 'destructive',
            title: 'טווח תאריכים קצר מדי',
            description: 'עליך לבחור לפחות יומיים.',
          });
          setSelectedRange({ from: range.from, to: undefined });
          return;
        }

        const newRangeDays = eachDayOfInterval({
          start: range.from,
          end: range.to,
        });

        const isOverlapping = newRangeDays.some(day =>
          allReservedDays.some(reservedDay => isSameDay(day, reservedDay))
        );

        if (isOverlapping) {
          toast({
            variant: 'destructive',
            title: 'תאריכים תפוסים',
            description: 'הטווח שבחרת כולל ימים שכבר נתפסו.',
          });
           setSelectedRange({ from: range.from, to: undefined });
          return;
        }

        setSelectedRange(range);
        setIsConfirmDialogOpen(true);
    } else {
      // This handles the first click or resetting the selection
      setSelectedRange(range);
    }
  };

  const handleConfirmReservation = async () => {
    if (
      !selectedRange ||
      !selectedRange.from ||
      !selectedRange.to ||
      !currentUser
    )
      return;

    const days = eachDayOfInterval({
      start: selectedRange.from,
      end: selectedRange.to,
    });

    const newReservations: Reservation[] = days.map(day => {
      const dateString = format(day, 'yyyy-MM-dd');
      return {
        id: dateString,
        userId: currentUser.id,
        user: currentUser,
      };
    });

    try {
      // For now, we update the local state.
      addReservations(newReservations);

      setIsConfirmDialogOpen(false);
      toast({
        title: 'השמירה אושרה!',
        description: `שבצת שמירה בהצלחה מתאריך ${format(
          selectedRange.from,
          'PPP', { locale: he }
        )} עד ${format(selectedRange.to, 'PPP', { locale: he })}.`,
      });
      setSelectedRange(undefined);
    } catch (error) {
      console.error('Error saving reservation: ', error);
      toast({
        variant: 'destructive',
        title: 'שגיאה',
        description: 'לא ניתן היה לשמור את השמירה. נסה שוב.',
      });
    }
  };

  const isPastDate = (date: Date) => date < startOfToday();

  return (
    <>
      <div className="mx-auto w-full max-w-md">
        <Calendar
          mode="range"
          min={2}
          selected={selectedRange}
          onSelect={handleRangeSelect}
          month={month}
          onMonthChange={setMonth}
          className="p-0"
          modifiers={{
            myReserved: myReservedDays,
            otherReserved: otherReservedDays,
            disabled: [isPastDate, ...allReservedDays],
          }}
          modifiersClassNames={{
            myReserved: 'bg-primary text-primary-foreground',
            otherReserved:
              'bg-muted text-muted-foreground line-through opacity-50',
            disabled: 'text-muted-foreground opacity-50 line-through',
          }}
          onDayClick={day => {
            const isReserved = allReservedDays.some(reservedDay =>
              isSameDay(day, reservedDay)
            );
            if (isReserved) {
              handleDateSelect(day);
            }
          }}
          disableNavigation={true}
        />
      </div>

      <AlertDialog
        open={isConfirmDialogOpen}
        onOpenChange={open => {
          if (!open) setSelectedRange(undefined);
          setIsConfirmDialogOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>אישור שמירה</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedRange?.from && selectedRange?.to
                ? `האם אתה בטוח שברצונך לשבץ שמירה מתאריך ${format(
                    selectedRange.from,
                    'PPP'
                  )} עד ${format(selectedRange.to, 'PPP')}?`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReservation}>
              אישור
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>פרטי החייל</AlertDialogTitle>
            {selectedReservist && (
              <AlertDialogDescription asChild>
                <div className="space-y-2 pt-2 text-sm text-foreground">
                  <p>
                    <strong>שם:</strong> {selectedReservist.name}{' '}
                    {selectedReservist.lastName}
                  </p>
                  <p>
                    <strong>דרגה:</strong> {selectedReservist.rank}
                  </p>
                  <p>
                    <strong>מספר אישי:</strong> {selectedReservist.id}
                  </p>
                </div>
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsInfoDialogOpen(false)}>
              סגור
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
