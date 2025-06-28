import { useState, useRef, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'

function ChatMessage({ sender, text }) {
  const isUser = sender === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl shadow 
        ${isUser ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
      >
        {text}
      </div>
    </div>
  )
}

function Test() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (input.trim() === '') return
    setMessages((prev) => [
      ...prev,
      { sender: 'user', text: input },
      { sender: 'assistant', text: 'You said: ' + input },
    ])
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend()
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header with logos */}
      <div className="p-4 flex items-center gap-4 shadow-md border-b">
        <h1 className="text-xl font-semibold">MedPal</h1>
      </div>

      {/* Chat window */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg, idx) => (
          <ChatMessage key={idx} sender={msg.sender} text={msg.text} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Welcome Message*/}
      <div className='text-5xl absolute left-[400px] top-[350px] w-[500px] '>
        How Can I Help You?
      </div>

      {/* Input area */}
        <input
          type="text"
          className="absolute left-[350px] top-[400px] w-[500px] p-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
        />
    </div>
  )
}

export default Test
