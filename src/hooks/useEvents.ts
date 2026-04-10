import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../services/firebaseConfig";
import { AppEvent } from "../services/eventService";

export const useEvents = (uid?: string) => {
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Temporary testing phase logic per user request: return ALL events.
    // In the future, we will apply a where clause based on the uid if provided. 
    const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppEvent));
      setEvents(data);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to events:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [uid]);

  return { events, loading };
};
