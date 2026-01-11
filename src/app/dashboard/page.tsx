
import GuardDutyCalendar from '@/components/guard-duty-calendar';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="flex flex-col">
      <header className="flex h-14 items-center justify-between bg-primary px-4">
        <span className="text-lg font-semibold text-primary-foreground">
          דיווחים עתידיים
        </span>
        <ChevronRight className="h-6 w-6 text-primary-foreground" />
      </header>
      <div className="flex-grow p-4">
        <div className="text-center">
          <p className="mb-4 max-w-2xl text-muted-foreground">
            לתזמון דיווח עתידי נא לבחור תאריך.
            <br />
            ניתן לערוך או למחוק דיווחים שתוזמנו
          </p>
        </div>
        <div className="mx-auto w-full max-w-md">
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <GuardDutyCalendar />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

    