"use client";
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faKey, faBuilding, faSpinner, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { useGoogleLogin } from '@react-oauth/google';

export default function Home() {
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [status, setStatus] = useState("Ready to Sync");
  const [isSyncing, setIsSyncing] = useState(false);
  const [formData, setFormData] = useState({
    venue: "",
    user: "",
    pass: ""
  });

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setGoogleToken(tokenResponse.access_token);
      setStatus("Google Authenticated! Ready to Sync.");
    },
    scope: "https://www.googleapis.com/auth/calendar.events",
  });

  const isFormValid = formData.venue.trim() !== "" && 
                      formData.user.trim() !== "" && 
                      formData.pass.trim() !== "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  async function handleSync() {
    if (!googleToken) {
      setStatus("❌ Please sign in with Google first!");
      return;
    }

    setIsSyncing(true);
    setStatus("Connecting...");
    
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "shift-sync-production.up.railway.app";
      const response = await fetch(`${apiBase}/sync`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venue_id: formData.venue,
          username: formData.user,
          password: formData.pass,
          google_token: googleToken
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n\n");
          
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = JSON.parse(line.replace("data: ", ""));
              setStatus(data.status);
            }
          }
        }
      }
    } catch (error) {
      setStatus("❌ Connection Error. Is the backend running?");
    } finally {
      setIsSyncing(false);
    }
  } // <-- THIS WAS THE MISSING BRACKET

  return (
    <main className="p-8 flex flex-col items-center">
      <div className="p-8 flex flex-col rounded-lg items-center">
        <h1 className="text-2xl font-bold mb-16 tracking-wider text-slate-100">ABI Shift Sync</h1>
        
        {/* STEP 1: Google Login (Show if no token) */}
        {!googleToken ? (
          <div className="flex flex-col items-center gap-4 mb-8">
            <p className="text-slate-300">Connect your Calendar</p>
            <button 
              onClick={() => login()} 
              className="bg-blue-500 text-slate-100 font-bold py-3 px-6 rounded shadow hover:bg-blue-400 hover:cursor-pointer flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faGoogle} />
              Sign in with Google
            </button>
          </div>
        ) : (
          /* STEP 2: ABI Form (Show only after login) */
          <div className="w-full animate-fade-in-down">
            <div className="bg-green-900/30 text-green-400 p-3 rounded mb-6 text-center text-sm border border-green-800">
              <FontAwesomeIcon icon={faCheckCircle} className="mr-2"/>
              Connected to Google Calendar
            </div>
            
            <p className='text-slate-400 w-full mb-4 text-center'>Step 2: Enter ABI Details</p>
            
            <form onSubmit={(e) => { e.preventDefault(); handleSync(); }} className="flex flex-col gap-8 w-81">
              <div className='flex flex-col gap-4'>
                <label className='text-slate-100 flex items-center gap-2'>
                  <FontAwesomeIcon icon={faBuilding} className="text-slate-500 text-xl" />
                  Venue ID
                </label>
                <input name="venue" value={formData.venue} onChange={handleChange} placeholder="e.g. SSE" className="ring-2 outline-none ring-slate-700 text-slate-400 p-4 tracking-normal rounded-[1vw] transition focus:text-slate-100 focus:ring-blue-400" />
              </div> 

              <div className='flex flex-col gap-4'>
                <label className='text-slate-100 flex items-center gap-2'>
                  <FontAwesomeIcon icon={faUser} className="text-slate-500 text-xl" />
                  User ID
                </label>
                <input name="user" value={formData.user} onChange={handleChange} placeholder="User ID" className="ring-2 outline-none ring-slate-700 text-slate-400 p-4 tracking-normal rounded-[1vw] transition focus:text-slate-100 focus:ring-blue-400"/>
              </div>

              <div className='flex flex-col gap-4'>
                <label className='text-slate-100 flex items-center gap-2'>
                  <FontAwesomeIcon icon={faKey} className="text-slate-500 text-xl" />
                  PIN
                </label>
                <input name="pass" value={formData.pass} onChange={handleChange} type="password" placeholder="PIN" className="ring-2 outline-none ring-slate-700 text-slate-400 p-4 tracking-normal rounded-[1vw] transition focus:text-slate-100 focus:ring-blue-400" />
              </div>

              <button
                type="submit" 
                disabled={!isFormValid || isSyncing} 
                className="flex items-center justify-center bg-blue-800 text-white font-regular tracking-wide p-4 rounded-[1vw] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-700 transition"
              >
                {isSyncing ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin className='mr-2 text-xl'/> 
                    <span>{status}</span>
                  </>
                ) : (
                  <span>Sync to Google Calendar</span>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      <div className='p-4 text-center'>
        <p className="text-sm font-mono mb-2 text-slate-100">By Charles Meng</p>
        <p className="text-sm font-mono text-slate-400">DM me about bug reports or questions</p>
      </div>
    </main>
  );
}