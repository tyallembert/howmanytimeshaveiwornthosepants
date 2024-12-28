"use client";

import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { User } from "firebase/auth";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import PantsActions from "./pantsActions";
import Image from "next/image";

interface Pants {
  id: string;
  name: string;
  size: string;
  imageUrl: string;
  lastWashDate: string | null;
  wearsSinceLastWash: number;
}
const UserPants = ({ user }: { user: User | null }) => {
  const [pants, setPants] = useState<Pants[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const [pressTimeout, setPressTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user) {
      const fetchPants = async () => {
        try {
          const pantsQuery = query(
            collection(db, "pants"),
            where("userId", "==", user.uid)
          );
          const pantsSnapshot = await getDocs(pantsQuery);
          const pantsList: Pants[] = [];

          for (const doc of pantsSnapshot.docs) {
            const pantsData = doc.data();
            const pantsId = doc.id;

            const actionsQuery = query(
              collection(db, "pants", pantsId, "actions"),
              orderBy("timestamp")
            );
            const actionsSnapshot = await getDocs(actionsQuery);

            let lastWashDate: string | null = null;
            let wearsCountSinceLastWash = 0;

            actionsSnapshot.forEach((actionDoc) => {
              const action = actionDoc.data();
              if (action.action === "wash") {
                lastWashDate = action.timestamp.toDate().toLocaleDateString();
                wearsCountSinceLastWash = 0;
              } else if (action.action === "wear") {
                wearsCountSinceLastWash++;
              }
            });

            pantsList.push({
              id: pantsId,
              name: pantsData.name,
              size: pantsData.size,
              imageUrl: pantsData.imageUrl,
              lastWashDate,
              wearsSinceLastWash: wearsCountSinceLastWash,
            });
          }

          setPants(pantsList);
          setLoading(false);
        } catch (err: unknown) {
          if (err instanceof Error) {
            setError(err.message || "Failed to fetch pants and actions. Please try again.");
            console.error("Failed to fetch pants and actions. Please try again.:", err);
          } else {
            setError("An unknown error occurred.");
            console.error("Failed to fetch pants and actions:", err);
          }
          setLoading(false);
        }
      };

      fetchPants();
    }
  }, [user]);

  const handlePressStart = (pantId: string) => {
    const timeout = setTimeout(() => {
      setActivePopup(pantId);
    }, 500); // 500ms delay
    setPressTimeout(timeout);
  };

  const handlePressEnd = () => {
    if (pressTimeout) {
      clearTimeout(pressTimeout);
    }
    setPressTimeout(null);
  };

  const closePopup = () => {
    setActivePopup(null);
  };

  if (loading) return <p>Loading your pants...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!pants.length) return <p>No pants found!</p>;

  return (
    <div className="flex flex-wrap justify-center md:justify-start gap-4 w-full">
      {pants.map((pant) => (
        <div
          key={pant.id}
          className="relative p-3 border rounded-lg w-64 bg-muted shadow"
          onMouseDown={() => handlePressStart(pant.id)}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={() => handlePressStart(pant.id)}
          onTouchEnd={handlePressEnd}
        >
          <Image
            src={pant.imageUrl}
            alt={pant.name}
            width={200}
            height={300}
            className="w-full h-48 object-cover rounded-md mb-4"
          />
          <h3 className="text-lg font-semibold">{pant.name}</h3>
          <p className="absolute -top-2 -right-2 w-16 flex flex-col items-center p-1 rounded-lg bg-primary text-white shadow">
            <span className="text-4xl font-bold">{pant.wearsSinceLastWash}</span>
            <span className="text-xs text-center">Since last wash</span>
          </p>
          <PantsActions user={user} pantsId={pant.id} />
          {activePopup === pant.id && (
            <div
              className="absolute top-0 left-0 w-full h-full bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-lg transition-all duration-200 opacity-100"
              onClick={closePopup}
            >
              <div className="absolute bottom-0 flex justify-around rounded-lg w-full p-5 border border-muted">
                <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/50">
                  Edit
                </button>
                <button className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default UserPants;

