
'use client';

import { useEffect, useMemo } from 'react';
import { useGuardDutyStore, useSyncUser } from '@/lib/state';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UserCheck } from 'lucide-react';
import { getMonth, getYear } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const { users, reservations } = useGuardDutyStore();
  const { currentUser, loading } = useSyncUser();
  const router = useRouter();

  // Redirect if not admin
  useEffect(() => {
    if (!loading && !currentUser?.isAdmin) {
      router.push('/dashboard');
    }
  }, [currentUser, loading, router]);

  const usersWithDutyCount = useMemo(() => {
    const currentMonth = getMonth(new Date());
    const currentYear = getYear(new Date());

    const dutyCounts: Record<string, number> = {};

    Object.entries(reservations).forEach(([dateStr, reservist]) => {
      // The date string is already in 'yyyy-MM-dd' format, which new Date() parses correctly as UTC.
      const reservationDate = new Date(dateStr);
      if (
        getYear(reservationDate) === currentYear &&
        getMonth(reservationDate) === currentMonth
      ) {
        dutyCounts[reservist.userId] = (dutyCounts[reservist.userId] || 0) + 1;
      }
    });

    return Object.values(users)
      .map(user => ({
        ...user,
        dutyCount: dutyCounts[user.id] || 0,
      }))
      .filter(user => user.dutyCount < 7);
  }, [reservations, users]);

  if (loading || !currentUser?.isAdmin) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4 md:p-8">
      <Card className="mx-auto w-full max-w-4xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <UserCheck />
            דוח שמירות חודשי
          </CardTitle>
          <CardDescription>
            חיילים ששובצו לפחות מ-7 שמירות בחודש הנוכחי.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usersWithDutyCount.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>שם</TableHead>
                  <TableHead>מספר אישי</TableHead>
                  <TableHead className="text-right">כמות שמירות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersWithDutyCount.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      {user.name} {user.lastName}
                    </TableCell>
                    <TableCell>{user.id}</TableCell>
                    <TableCell className="text-right">
                      {user.dutyCount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground">
              כל החיילים המשובצים ביצעו 7 שמירות או יותר החודש.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
