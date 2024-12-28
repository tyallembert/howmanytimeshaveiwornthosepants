import { useState, useEffect, useCallback } from "react";
import { db } from "../firebase/config"; // Ensure Firestore is configured
import { collection, addDoc, query, where, getDocs, Timestamp } from "firebase/firestore";
import { User } from "firebase/auth";

interface PantsProps {
  user: User | null;
  pantsId: string;
}

const PantsActions = ({ user, pantsId }: PantsProps) => {
  const [actions, setActions] = useState<Record<"wear" | "wash", boolean>>({
    wear: false,
    wash: false,
  });

  const fetchActionsForToday = useCallback(async () => {
    if (!pantsId || !user) return;

    const actionsRef = collection(db, "pants", pantsId, "actions");
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const q = query(
      actionsRef,
      where("date", ">=", startOfDay),
      where("date", "<=", endOfDay)
    );

    const querySnapshot = await getDocs(q);

    const actionsLogged = querySnapshot.docs.map(doc => doc.data().action);
    setActions({
      wear: !actionsLogged.includes("wear"),
      wash: !actionsLogged.includes("wash"),
    });
  }, [pantsId, user]);

  useEffect(() => {
    fetchActionsForToday();
  }, [fetchActionsForToday]);

  const logAction = async (actionType: "wear" | "wash") => {
    if (!actions[actionType]) {
      alert(`You can only log one ${actionType} per day.`);
      return;
    }

    const actionsRef = collection(db, "pants", pantsId, "actions");
    const newAction = {
      action: actionType,
      date: Timestamp.now(),
    };

    await addDoc(actionsRef, newAction);
    fetchActionsForToday(); // Refresh actions after logging
  };

  const handleWear = async () => {
    await logAction("wear");
  };

  const handleWash = async () => {
    await logAction("wash");
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={handleWear}
        disabled={!actions.wear}
        className={`p-3 rounded-md border w-full bg-primary hover:bg-primary/70 text-white font-bold transition-all ${
          !actions.wear ? "bg-primary/70 opacity-70" : ""
        }`}
      >
        Wear
      </button>
      <button
        onClick={handleWash}
        disabled={!actions.wash}
        className={`p-3 rounded-md border border-primary w-full text-primary hover:bg-primary/70 hover:text-white font-bold transition-all ${
          !actions.wash
            ? "text-primary/70 border-primary/70 hover:bg-transparent hover:text-primary/70"
            : ""
        }`}
      >
        Wash
      </button>
    </div>
  );
};

export default PantsActions;
