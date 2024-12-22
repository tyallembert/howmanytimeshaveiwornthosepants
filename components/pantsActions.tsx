import { useState, useEffect } from "react";
import { db } from "../firebase/config"; // Make sure to configure Firestore correctly
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { User } from "firebase/auth";

interface PantsProps {
  user: User | null;
  pantsId: string;
}

const PantsActions = ({ user, pantsId }: PantsProps) => {
  const [canWear, setCanWear] = useState<boolean>(false);
  const [canWash, setCanWash] = useState<boolean>(false);

  const checkActionForToday = async (
    pantsId: string,
    actionType: "wear" | "wash"
  ) => {
    const actionsRef = collection(db, "pants", pantsId, "actions");
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const q = query(
      actionsRef,
      where("action", "==", actionType),
      where("date", ">=", startOfDay),
      where("date", "<=", endOfDay)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.empty; // Returns true if no actions for today
  };

  // Function to log a wear or wash action
  const logAction = async (pantsId: string, actionType: "wear" | "wash") => {
    const isActionAllowed = await checkActionForToday(pantsId, actionType);

    if (!isActionAllowed) {
      alert(`You can only log one ${actionType} per day.`);
      return;
    }

    const actionsRef = collection(db, "pants", pantsId, "actions");
    const newAction = {
      action: actionType,
      timestamp: Timestamp.now(),
    };

    await addDoc(actionsRef, newAction);
  };

  // Check if the user can wear or wash the pants today
  const checkActions = async () => {
    if (!pantsId || !user) return;

    // Check for 'wear' and 'wash' actions
    const canWearToday = await checkActionForToday(pantsId, "wear");
    const canWashToday = await checkActionForToday(pantsId, "wash");

    setCanWear(canWearToday);
    setCanWash(canWashToday);
  };

  useEffect(() => {
    checkActions();
  }, [pantsId, user]);

  const handleWear = async () => {
    if (!pantsId || !user) return;
    await logAction(pantsId, "wear");
    checkActions(); // Recheck after action is logged
  };

  const handleWash = async () => {
    if (!pantsId || !user) return;
    await logAction(pantsId, "wash");
    checkActions(); // Recheck after action is logged
  };

  return (
    <div className="flex gap-3">
        <button
            onClick={handleWear}
            disabled={!canWear}
            className={`p-3 rounded-md border w-full bg-primary hover:bg-primary/70 text-white font-bold transition-all ${!canWear ? "bg-primary/70":""}`}
        >
            Wear
        </button>
        <button
            onClick={handleWash}
            disabled={!canWash}
            className={`p-3 rounded-md border border-primary w-full text-primary hover:bg-primary/70 hover:text-white font-bold transition-all ${!canWash ? "text-primary/70 border-primary/70 hover:bg-transparent hover:text-primary/70":""}`}
        >
            Wash
        </button>
    </div>
  );
};

export default PantsActions;
