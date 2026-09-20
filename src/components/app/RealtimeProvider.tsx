"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";

export type RealtimeStatus = "connecting" | "connected" | "reconnecting" | "disconnected";
type Listener = (payload: unknown) => void;

interface RealtimeCtx {
  status: RealtimeStatus;
  /** Increments on each (re)connect — pages refetch REST when this changes to catch missed events. */
  connectionEpoch: number;
  /** Register a meeting-change listener; returns an unsubscribe fn. */
  onMeetingChange: (cb: Listener) => () => void;
}

const Ctx = createContext<RealtimeCtx>({
  status: "disconnected",
  connectionEpoch: 0,
  onMeetingChange: () => () => {},
});

export function useMeetingsRealtime(): RealtimeCtx {
  return useContext(Ctx);
}

/**
 * ONE authenticated Supabase Realtime private channel per signed-in user:
 * `user:<uid>:meetings`. Meeting INSERT/UPDATE is broadcast from Postgres (see the realtime
 * migration); we treat each message as a NOTIFICATION and let pages refetch REST (the source of
 * truth). Mounted once in the app layout so /app/meetings and /app/meetings/[id] share it — no
 * duplicate subscriptions across rerenders. Auto-reconnects; cleans up on unmount/logout.
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<RealtimeStatus>(
    isSupabaseConfigured ? "connecting" : "disconnected",
  );
  const [connectionEpoch, setConnectionEpoch] = useState(0);
  const listeners = useRef<Set<Listener>>(new Set());
  const channelRef = useRef<RealtimeChannel | null>(null);

  const onMeetingChange = useCallback((cb: Listener) => {
    listeners.current.add(cb);
    return () => {
      listeners.current.delete(cb);
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabaseBrowser();
    let cancelled = false;

    async function connect() {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (cancelled) return;
      if (!session) {
        setStatus("disconnected");
        return;
      }
      // Private channels are authorized via the JWT (RLS on realtime.messages).
      await supabase.realtime.setAuth(session.access_token);

      const channel = supabase.channel(`user:${session.user.id}:meetings`, {
        config: { private: true },
      });
      channelRef.current = channel;

      channel.on("broadcast", { event: "*" }, (payload) => {
        listeners.current.forEach((cb) => cb(payload));
      });

      channel.subscribe((s) => {
        if (cancelled) return;
        if (s === "SUBSCRIBED") {
          setStatus("connected");
          setConnectionEpoch((e) => e + 1);
        } else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") {
          setStatus("reconnecting");
        } else if (s === "CLOSED") {
          setStatus("disconnected");
        }
      });
    }

    void connect();

    // Keep realtime auth fresh; tear down on logout.
    const { data: authSub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        if (channelRef.current) {
          void supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
        setStatus("disconnected");
      } else if (session) {
        void supabase.realtime.setAuth(session.access_token);
      }
    });

    return () => {
      cancelled = true;
      authSub.subscription.unsubscribe();
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  return (
    <Ctx.Provider value={{ status, connectionEpoch, onMeetingChange }}>{children}</Ctx.Provider>
  );
}
