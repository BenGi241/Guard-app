
'use client';

import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format, parse } from 'date-fns';
import { Button } from '@/components/ui/button';
import { KeyRound, Repeat } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useGuardDutyStore,
  generateSecretCode,
  useSyncUser,
} from '@/lib/state';

export default function SwapPage() {
  const { toast } = useToast();
  const [swapCode, setSwapCode] = useState('');
  const { currentUser } = useSyncUser();
  const { users, setUsers, reservations, setReservations } =
    useGuardDutyStore();

  const handleSwap = async () => {
    if (!swapCode) {
      toast({
        variant: 'destructive',
        title: 'קוד סודי נדרש',
        description: 'אנא הזן את הקוד הסודי של המשתמש איתו תרצה להחליף.',
      });
      return;
    }

    if (!currentUser) return;

    const otherUser = Object.values(users).find(
      u => u.secretCode === swapCode && u.id !== currentUser.id
    );

    if (!otherUser) {
      toast({
        variant: 'destructive',
        title: 'משתמש לא נמצא',
        description: 'הקוד הסודי שהוזן שגוי או שייך למשתמש הנוכחי.',
      });
      return;
    }

    const currentUserReservationEntries = Object.entries(reservations).filter(
      ([, reservist]) => reservist.userId === currentUser.id
    );
    const otherUserReservationEntries = Object.entries(reservations).filter(
      ([, reservist]) => reservist.userId === otherUser.id
    );

    if (currentUserReservationEntries.length === 0) {
      toast({
        variant: 'destructive',
        title: 'לא נמצאה שמירה',
        description: 'עליך לקבוע שמירה לפני שתוכל לבצע החלפה.',
      });
      return;
    }

    if (otherUserReservationEntries.length === 0) {
      toast({
        variant: 'destructive',
        title: 'למשתמש השני אין שמירה',
        description: `ל${otherUser.name} אין שמירה קבועה במערכת, לכן לא ניתן לבצע החלפה.`,
      });
      return;
    }

    // Simplified swap: swap all reservations
    const updatedReservations = { ...reservations };

    currentUserReservationEntries.forEach(([date]) => {
      delete updatedReservations[date];
    });
    otherUserReservationEntries.forEach(([date]) => {
      delete updatedReservations[date];
    });

    currentUserReservationEntries.forEach(([date]) => {
      updatedReservations[date] = {
        id: date,
        userId: otherUser.id,
        user: otherUser,
      };
    });

    otherUserReservationEntries.forEach(([date]) => {
      updatedReservations[date] = {
        id: date,
        userId: currentUser.id,
        user: currentUser,
      };
    });

    setReservations(updatedReservations);

    // This part is tricky without a proper user collection.
    // We update the local state for now.
    setUsers({
      ...users,
      [currentUser.id]: { ...currentUser, secretCode: generateSecretCode() },
      [otherUser.id]: { ...otherUser, secretCode: generateSecretCode() },
    });

    try {
      // In a real app, you would commit this batch to Firestore.
      // await batch.commit();

      toast({
        title: 'ההחלפה בוצעה בהצלחה!',
        description: `החלפת את השמירות שלך עם השמירות של ${otherUser.name}. קודים סודיים חדשים נוצרו.`,
      });
      setSwapCode('');
    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'שגיאה',
        description: 'אירעה שגיאה בביצוע ההחלפה',
      });
    }
  };

  const currentUserSecretCode = useMemo(() => {
    if (!currentUser) return '';
    return users[currentUser.id]?.secretCode || '';
  }, [users, currentUser]);

  if (!currentUser) {
    return <div>טוען נתונים...</div>;
  }

  return (
    <div className="p-4 md:p-8">
      <Card className="mx-auto w-full max-w-4xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Repeat />
            החלפת שמירה
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-0">
          <div className="rounded-md border bg-background/50 p-3">
            <p className="flex items-center text-sm font-medium text-muted-foreground">
              <KeyRound className="mr-2 h-4 w-4 text-primary" />
              הקוד הסודי שלך (שימוש יחיד):
              <span className="ml-2 font-mono text-foreground">
                {currentUserSecretCode}
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              שתף קוד זה רק עם מי שאתה רוצה להחליף איתו שמירה. לאחר שימוש, קוד
              חדש יונפק.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="swap-code">קוד סודי של חייל אחר</Label>
            <div className="flex gap-2">
              <Input
                id="swap-code"
                placeholder="הזן קוד להחלפה"
                value={swapCode}
                onChange={e => setSwapCode(e.target.value)}
                className="w-full"
              />
              <Button onClick={handleSwap} className="shrink-0">
                <Repeat className="mr-2 h-4 w-4" />
                בצע החלפה
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              כדי להחליף, שניכם צריכים לקבוע שמירה לפני כן.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
