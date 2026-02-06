"use client";
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarCheck, faUser, faKey, faBuilding, faSpinner } from '@fortawesome/free-solid-svg-icons';

export default function Home() {
  const [status, setStatus] = useState("Ready to Sync");
  const [isSyncing, setIsSyncing] = useState(false);

  const [formData, setFormData] = useState({
    venue: "",
    user: "",
    pass: ""
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
    setIsSyncing(true);
    setStatus("Connecting...");
    
    const response = await fetch("http://127.0.0.1:8000/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        venue_id: formData.venue,
        username: formData.user,
        password: formData.pass
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
      setIsSyncing(false);
    }
  }

  return (
    <main className="p-8 flex flex-col items-center">
      <div className="p-8 flex flex-col rounded-lg items-center">
        <h1 className="text-2xl font-bold mb-8 tracking-wider text-slate-100">ABI Shift Sync</h1>
        <p className='italic text-slate-400 w-full mb-4'>All fields required</p>
        <form 
        onSubmit={(e) => { e.preventDefault(); handleSync(); }} 
        className="flex flex-col gap-8 w-81">
          <div className='flex flex-col gap-4'>
            <label className='text-slate-100 flex items-center gap-2'>
              <FontAwesomeIcon icon={faBuilding} className="text-slate-500 text-xl" />
              Venue ID
            </label>
            <input name="venue" value={formData.venue} onChange={handleChange} placeholder="e.g. SSE" className="
            ring-2 outline-none ring-slate-700 text-slate-400 p-4 tracking-normal rounded-[1vw] 
            transition
            placeholder:duration-150
            placeholder:ease-linear 
            focus:text-slate-100 
            focus:placeholder-transparent
            focus:ring-2
            focus:ring-blue-400
            focus:drop-shadow-md
            focus:drop-shadow-blue-500/10
            " />
          </div> 
          <div className='flex flex-col gap-4'>
            <label className='text-slate-100 flex items-center gap-2'>
              <FontAwesomeIcon icon={faUser} className="text-slate-500 text-xl" />
              User ID
            </label>
            <input name="user" value={formData.user} onChange={handleChange} placeholder="User ID" className="ring-2  outline-none ring-slate-700 text-slate-400 p-4 tracking-normal rounded-[1vw] 
            transition
            placeholder:duration-150
            placeholder:ease-linear 
            focus:placeholder-transparent
            focus:text-slate-100 
            focus:ring-2
            focus:ring-blue-400
            focus:drop-shadow-md
            focus:drop-shadow-blue-500/25
            "/>
          </div>
          <div className='flex flex-col gap-4'>
            <label className='text-slate-100 flex items-center gap-2'>
              <FontAwesomeIcon icon={faKey} className="text-slate-500 text-xl" />
              PIN
            </label>
            <input name="pass" value={formData.pass} onChange={handleChange} type="password" placeholder="PIN" className="ring-2 outline-none ring-slate-700 text-slate-400 p-4 tracking-normal rounded-[1vw] 
            transition
            placeholder:duration-150
            placeholder:ease-linear 
            focus:placeholder-transparent
            focus:text-slate-100 
            focus:ring-2
            focus:ring-blue-400
            focus:drop-shadow-md
            focus:drop-shadow-blue-500/25
            " />
          </div>
          <button
          type="submit" 
          disabled={!isFormValid || isSyncing} 
          className="flex items-center justify-center bg-blue-800 text-white font-regular tracking-wide p-4 rounded-[1vw] 
          disabled:opacity-50
          hover:bg-blue-700
          transition
          disabled:duration-150
          disabled:opacity-30
          disabled:cursor-not-allowed
          disabled:bg-slate-700
          ">{isSyncing ? (
            <>
              <FontAwesomeIcon icon={faSpinner} spin className='mr-2 text-xl'/> 
              <span>{status}</span>
            </>
            ) : (
            <>
              <span>Sync to Google Calendar</span>
            </>
            )}
          </button>
        </form>        
      </div>
      <div className='p-4'>
        <p className="text-sm font-mono mb-2 text-slate-100">By Charles Meng</p>
        <p className="text-sm font-mono mb-2 text-slate-100">DM me about bug reports or questions</p>
      </div>

    </main>
  );
}