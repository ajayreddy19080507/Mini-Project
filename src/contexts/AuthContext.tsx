"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthUser {
    uid: string;
    email: string | null;
    role: string | null;       // "PRINCIPAL" | "HOD" | "FACULTY"
    department: string | null; // e.g. "CSE"
}

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    logout: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Fetch custom role/dept from our DB
                try {
                    const res = await fetch(`/api/auth/me?email=${firebaseUser.email}`);
                    if (res.ok) {
                        const data = await res.json();
                        setUser({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            role: data.role,
                            department: data.department
                        });
                    } else {
                        // Fallback if DB entry missing (shouldn't happen if creating logic is correct)
                        setUser({ uid: firebaseUser.uid, email: firebaseUser.email, role: null, department: null });
                    }
                } catch (e) {
                    console.error(e);
                    setUser({ uid: firebaseUser.uid, email: firebaseUser.email, role: null, department: null });
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        if (auth) await signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
