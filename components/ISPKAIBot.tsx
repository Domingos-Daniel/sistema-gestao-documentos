"use client"

import { useState } from "react"

export function ISPKAIBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { from: "bot", text: "Olá! Eu sou o ISPK AI. Como posso ajudar você hoje?" }
  ])
  const [input, setInput] = useState("")

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    setMessages(msgs => [...msgs, { from: "user", text: input }])
    setInput("")
    setTimeout(() => {
      setMessages(msgs => [
        ...msgs,
        { from: "bot", text: "Desculpe, ainda estou aprendendo! Em breve responderei perguntas reais." }
      ])
    }, 900)
  }

  return (
    <>
      <button
        aria-label="Abrir ISPK AI"
        className="fixed z-50 bottom-6 right-6 bg-primary text-white rounded-full shadow-lg p-4 flex items-center gap-2 hover:bg-primary/90 transition-all"
        style={{ boxShadow: "0 4px 32px 0 rgba(0,0,0,0.18)" }}
        onClick={() => setOpen(true)}
        tabIndex={0}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="mr-1">
          <circle cx="12" cy="12" r="12" fill="#2563eb" />
          <text x="12" y="17" textAnchor="middle" fontSize="12" fill="white" fontWeight="bold">AI</text>
        </svg>
        <span className="font-bold hidden sm:inline">ISPK AI</span>
      </button>
      {open && (
        <div className="fixed z-50 bottom-24 right-6 w-[90vw] max-w-sm bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col animate-fade-in-up">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-primary rounded-t-xl">
            <span className="font-bold text-white flex items-center gap-2">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="12" fill="#fff" fillOpacity={0.15} />
                <text x="12" y="16" textAnchor="middle" fontSize="10" fill="#2563eb" fontWeight="bold">AI</text>
              </svg>
              ISPK AI
            </span>
            <button
              aria-label="Fechar ISPK AI"
              className="text-white hover:text-gray-200 text-xl font-bold"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-gray-50" style={{ maxHeight: 320 }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`rounded-lg px-3 py-2 text-sm max-w-[80%] ${
                    msg.from === "user"
                      ? "bg-primary text-white"
                      : "bg-gray-200 text-gray-900"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSend} className="flex items-center gap-2 border-t px-3 py-2 bg-white rounded-b-xl">
            <input
              className="flex-1 rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              placeholder="Digite sua mensagem..."
              value={input}
              onChange={e => setInput(e.target.value)}
              autoFocus
            />
            <button
              type="submit"
              className="bg-primary text-white rounded px-3 py-2 font-semibold hover:bg-primary/90 transition"
              disabled={!input.trim()}
            >
              Enviar
            </button>
          </form>
        </div>
      )}
      <style jsx global>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(40px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .animate-fade-in-up { animation: fade-in-up 0.4s cubic-bezier(0.22,1,0.36,1) both;}
      `}</style>
    </>
  )
}