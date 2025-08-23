"use client"

import AppContextProvider from "@/components/context/AppContextProvider";
import { SessionProvider } from "next-auth/react"


export default function Providers({ children }) {
    return (
        <SessionProvider>
            <AppContextProvider>
                {children}
            </AppContextProvider>
        </SessionProvider>
    );
}