"use client";
import { useEffect, useState } from 'react';
import { auth } from '../firebase/config'; // Adjust the path as necessary
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import UserPants from '@/components/displayPants';
import AddPantsForm from '@/components/addNewPants';
import Navigation from '@/components/navigation';

export default function Home() {
  const [user, setUser] = useState<null | User>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
        router.push('/login'); // Redirect to login if not authenticated
      }
    });

    return () => unsubscribe(); // Clean up listener on component unmount
  }, [router]);

  return (
    <main className="relative flex flex-col gap-3 w-full min-h-screen bg-secondary">
      <Navigation user={user}/>
      <section className='flex flex-col gap-3 p-5 h-screen'>
        <AddPantsForm user={user} />
        <UserPants user={user}/>
      </section>
    </main>
  );
}
