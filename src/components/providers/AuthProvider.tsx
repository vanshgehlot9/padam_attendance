"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getEmployee, Employee } from "@/lib/firestore";

interface AuthContextType {
    user: User | null;
    employeeData: Employee | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    employeeData: null,
    loading: true,
    login: async () => { },
    logout: async () => { },
});

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [employeeData, setEmployeeData] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                // Try to fetch employee data using UID as employee ID
                try {
                    const emp = await getEmployee(firebaseUser.uid);
                    setEmployeeData(emp);
                } catch (e) {
                    console.error("Error fetching employee data:", e);
                    setEmployeeData(null);
                }
            } else {
                setEmployeeData(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const logout = async () => {
        await signOut(auth);
        setEmployeeData(null);
    };

    return (
        <AuthContext.Provider value={{ user, employeeData, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
