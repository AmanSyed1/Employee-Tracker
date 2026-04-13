import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "../services/firebaseConfig";
import { LeaveRequest } from "../services/leaveService";

export const useLeaves = (uid?: string) => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "sick_leaves"),
      where("uid", "==", uid),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as LeaveRequest[];
        setLeaves(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error listening to leaves:", err);
        
        let userFriendlyError = "Failed to fetch leaves. Please try again.";
        
        if (err.message?.includes("requires an index")) {
          userFriendlyError = "Database setup incomplete. Please contact admin.";
        }
        
        setError(userFriendlyError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  return { leaves, loading, error };
};
