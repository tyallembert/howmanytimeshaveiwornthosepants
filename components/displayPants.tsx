// components/UserPants.tsx
"use client";

import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { User } from "firebase/auth";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import PantsActions from "./pantsActions";
import { Timestamp } from "firebase/firestore";

interface Pants {
    id: string;
    name: string;
    size: string;
    imageUrl: string;
    lastWashDate: Timestamp | null;
    wearsSinceLastWash: number;
  }

const UserPants = ({ user }: { user: null | User }) => {
  const [pants, setPants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
        const fetchPants = async () => {
            if (!user) return;
    
            try {
              // Query pants for the user
              const pantsQuery = query(
                collection(db, "pants"),
                where("userId", "==", user.uid)
              );
              const pantsSnapshot = await getDocs(pantsQuery);
              const pantsList: Pants[] = [];
    
              // For each pants item, get wear and wash actions
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
                let lastWashTimestamp: Timestamp | null = null;
    
                // If there are no actions for this pants item, we handle it gracefully
                if (actionsSnapshot.empty) {
                  pantsList.push({
                    id: pantsId,
                    name: pantsData.name,
                    size: pantsData.size,
                    imageUrl: pantsData.imageUrl,
                    lastWashDate: null, // No wash recorded
                    wearsSinceLastWash: 0, // No wears recorded
                  });
                  continue; // Skip to the next pair of pants
                }
    
                actionsSnapshot.forEach((actionDoc) => {
                  const action = actionDoc.data();
                  const actionTimestamp = action.timestamp.toDate();
                  console.log(action)
    
                  if (action.action === "wash") {
                    lastWashTimestamp = action.timestamp;
                    lastWashDate = actionTimestamp.toLocaleDateString(); // Format the date
                    wearsCountSinceLastWash = 0; // Reset wear count after wash
                  } else if (action.action === "wear") {
                    // Count wears after the last wash
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
    
              setLoading(false);
              setPants(pantsList);
            } catch (err) {
              setLoading(false);
              setError("Failed to fetch pants and actions. Please try again.");
              console.error("Error fetching pants and actions:", err);
            }
          };

      fetchPants();
    }
  }, [user]);

  if (loading) {
    return <p>Loading your pants...</p>;
  }

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  if (!pants.length) {
    return <p>No pants found!</p>;
  }

  return (
    <div className="flex flex-wrap gap-3 w-full">
    {pants.map((pant) => (
        <div className="relative p-3 border rounded-lg w-64 bg-card shadow" key={pant.id}>
            <img src={pant.imageUrl} alt={pant.name} className="w-full h-48 object-cover rounded-md mb-4" />
            <h3 className="text-lg font-semibold">{pant.name}</h3>
            <p className="absolute -top-2 -right-2 w-16 flex flex-col items-center p-1 rounded-lg bg-primary text-white shadow">
                <span className="text-4xl font-bold">{pant.wearsSinceLastWash}</span>
                <span className="text-xs text-center">Since last wash</span> 
            </p>
            <PantsActions user={user} pantsId={pant.id} />
        </div>
    ))}
    </div>
  );
};

export default UserPants;
