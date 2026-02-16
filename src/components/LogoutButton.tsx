'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useState } from 'react';

interface LogoutButtonProps {
    className?: string;
}

export default function LogoutButton({ className }: LogoutButtonProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const handleLogout = async () => {
        try {
            setLoading(true);
            await supabase.auth.signOut();
            router.push('/login');
            router.refresh(); // Clear any server-side cached data
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleLogout}
            className={className}
            disabled={loading}
        >
            <LogOut size={18} />
            {loading ? 'Logging out...' : 'Logout'}
        </button>
    );
}
