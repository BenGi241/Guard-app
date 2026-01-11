import { create } from 'zustand';
import { useUser as useFirebaseUser } from '@/firebase';
import { useEffect } from 'react';
import { addDays, format } from 'date-fns';

export type User = {
  name: string;
  lastName: string;
  id: string; // This will be the Firebase Auth UID
  rank: string;
  secretCode: string;
  isAdmin?: boolean;
  email?: string | null;
  photoURL?: string | null;
};

export type Reservation = {
  id: string; // yyyy-MM-dd
  userId: string;
  user: User; // Denormalized user data for easy display
};

export const generateSecretCode = () =>
  `code-${Math.random().toString(36).substring(2, 8)}`;

// This is a temporary in-memory store for users who are not in Firebase yet.
// In a real app, you would fetch this from Firestore.
const mockUsers: Record<string, Omit<User, 'id' | 'email' | 'photoURL'>> = {
  'israel@example.com': {
    name: 'ישראל',
    lastName: 'ישראלי',
    rank: 'רב"ט',
    secretCode: generateSecretCode(),
    isAdmin: true,
  },
  'moshe@example.com': {
    name: 'משה',
    lastName: 'כהן',
    rank: 'סמל',
    secretCode: generateSecretCode(),
    isAdmin: false,
  },
  'sara@example.com': {
    name: 'שרה',
    lastName: 'לוי',
    rank: 'רב"ט',
    secretCode: generateSecretCode(),
    isAdmin: false,
  },
};

const usersWithIds: Record<string, User> = Object.entries(mockUsers).reduce(
  (acc, [email, data]) => {
    // In mock, use email as a stand-in for a real ID
    const id = email;
    acc[id] = { ...data, id, email, photoURL: null };
    return acc;
  },
  {} as Record<string, User>
);

const createMockReservations = (): Record<string, Reservation> => {
  const reservations: Record<string, Reservation> = {};
  const today = new Date();
  const moshe = usersWithIds['moshe@example.com'];
  const sara = usersWithIds['sara@example.com'];

  // Moshe's reservation (5-7 days from now)
  for (let i = 5; i <= 7; i++) {
    const date = addDays(today, i);
    const dateString = format(date, 'yyyy-MM-dd');
    reservations[dateString] = {
      id: dateString,
      userId: moshe.id,
      user: moshe,
    };
  }

  // Sara's reservation (10-12 days from now)
  for (let i = 10; i <= 12; i++) {
    const date = addDays(today, i);
    const dateString = format(date, 'yyyy-MM-dd');
    reservations[dateString] = {
      id: dateString,
      userId: sara.id,
      user: sara,
    };
  }

  return reservations;
};

interface GuardDutyState {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  users: Record<string, User>;
  setUsers: (users: Record<string, User>) => void;
  reservations: Record<string, Reservation>;
  setReservations: (reservations: Record<string, Reservation>) => void;
  addReservations: (newReservations: Reservation[]) => void;
}

const useGuardDutyStore = create<GuardDutyState>((set, get) => ({
  currentUser: null,
  setCurrentUser: user => set({ currentUser: user }),
  users: usersWithIds,
  setUsers: users => set({ users }),
  reservations: createMockReservations(),
  setReservations: reservations => set({ reservations }),
  addReservations: newReservations =>
    set(state => {
      const updatedReservations = { ...state.reservations };
      newReservations.forEach(res => {
        updatedReservations[res.id] = res;
      });
      return { reservations: updatedReservations };
    }),
}));

// A hook to sync Firebase Auth state with our Zustand store
export const useSyncUser = () => {
  const { data: firebaseUser, loading } = useFirebaseUser();
  const { currentUser, setCurrentUser, users, setUsers } = useGuardDutyStore();
  const stateRef = useGuardDutyStore.getState();

  useEffect(() => {
    if (loading) return;

    if (firebaseUser) {
      // Check if user already exists in the store by UID
      const existingUser = stateRef.users[firebaseUser.uid];

      if (existingUser) {
        // If user exists, ensure they are the current user
        if (
          !stateRef.currentUser ||
          stateRef.currentUser.id !== existingUser.id
        ) {
          setCurrentUser(existingUser);
        }
      } else {
        // User does not exist, create a new one from mock data or defaults
        const email = firebaseUser.email || '';
        const mockData = mockUsers[email] || {
          name: firebaseUser.displayName?.split(' ')[0] || 'New',
          lastName: firebaseUser.displayName?.split(' ')[1] || 'User',
          rank: 'טוראי',
          secretCode: generateSecretCode(),
          isAdmin: email === 'admin@example.com', // Example admin logic
        };

        const newUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
          ...mockData,
        };

        // Add the new user to the users map and set as current user
        const updatedUsers = { ...stateRef.users, [newUser.id]: newUser };
        setUsers(updatedUsers);
        setCurrentUser(newUser);
      }
    } else {
      // No firebase user, so clear the current user if not in mock login mode
      if (
        stateRef.currentUser &&
        !Object.values(mockUsers).some(
          u => u.name === stateRef.currentUser?.name
        )
      ) {
        setCurrentUser(null);
      }
    }
  }, [firebaseUser, loading, setCurrentUser, setUsers, stateRef]);

  return { currentUser, loading: currentUser ? false : loading };
};

export { useGuardDutyStore };
