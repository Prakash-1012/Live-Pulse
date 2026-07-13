import { RouterProvider } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Brain } from 'lucide-react';
import { router } from './routes';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="fixed top-4 left-4 z-50 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-lg backdrop-blur-sm">
        <Brain className="h-6 w-6 text-violet-600" />
        <span className="font-semibold text-slate-900">BrainBuzz</span>
      </div>
      <RouterProvider router={router} />
    </GoogleOAuthProvider>
  );
}