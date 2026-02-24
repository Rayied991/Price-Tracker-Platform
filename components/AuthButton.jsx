"use client";
import { signOut } from "@/app/actions";
import { LogIn, LogOut } from "lucide-react";
import { useState } from "react";
import { AuthModal } from "./AuthModal";
import { Button } from "./ui/button";

const AuthButton = ({ user }) => {
    const [showAuthModal, setShowAuthModal] = useState(false);

    if (user) {
        return (
            <form action={signOut}>
                <Button
                    variant="ghost"
                    size="sm"
                    type="submit"
                    className={"gap-2"} >
                    <LogOut className="h-4 w-4" />
                    Sign Out</Button>
            </form>
        )
    }
    return (
        <>
            <Button
                onClick={() => setShowAuthModal(true)}
                variant="default"
                size="sm"
                className={"bg-orange-500 hover:bg-orange-600 gap-2"} >
                <LogIn className="h-4 w-4" />
                Sign In
            </Button>

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
            />
        </>
    )
}

export default AuthButton