import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Trash2 } from 'lucide-react';
import api from '../services/api';
import socket from '../socket';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import NavBar from '../components/NavBar';

export default function MessagesPage() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const { households } = useHousehold();
  const navigate = useNavigate();
  const household = households.find((h) => h._id === groupId);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get(`/messages/${groupId}`).then(({ data }) => setMessages(data)).catch(() => {});
    socket.emit('join:room', groupId);
    socket.on('message:new', (msg) =>
      setMessages((prev) => prev.some((m) => m._id === msg._id) ? prev : [...prev, msg])
    );
    return () => socket.off('message:new');
  }, [groupId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const content = text.trim();
    setText('');
    try {
      const { data } = await api.post('/messages', { household_id: groupId, content });
      setMessages((prev) => [...prev, data]);
    } catch {}
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/messages/${id}`);
      setMessages((prev) => prev.filter((m) => m._id !== id));
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{ paddingBottom: '64px' }}>
      <NavBar />
      <div className="max-w-md mx-auto w-full px-4 pt-6 flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-3 mb-4 flex-shrink-0">
          <button onClick={() => navigate('/groups')} className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{household?.name || 'Group'}</h1>
            <p className="text-xs text-gray-400">Chat</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 mb-3 min-h-0">
          {messages.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">No messages yet. Say hi.</p>
            </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.sender_id?._id === user?._id || msg.sender_id === user?._id;
            return (
              <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                <div className={`max-w-xs rounded-2xl px-4 py-2 shadow-sm ${isMe ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-100 text-gray-800'}`}>
                  {!isMe && (
                    <p className="text-xs font-semibold text-indigo-600 mb-0.5">{msg.sender_id?.name}</p>
                  )}
                  <p className="text-sm">{msg.content}</p>
                  <div className={`flex items-center justify-between mt-0.5 ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                    <p className="text-xs">
                      {new Date(msg.timestamp || msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {isMe && (
                      <button onClick={() => handleDelete(msg._id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 hover:text-red-300">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="flex gap-2 bg-white border border-gray-200 rounded-2xl p-2 shadow-sm flex-shrink-0">
          <input type="text" placeholder="Type a message..." value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 px-3 py-2 text-sm focus:outline-none" />
          <button type="submit" disabled={!text.trim()}
            className="bg-indigo-600 text-white p-2.5 rounded-xl disabled:opacity-40 transition-opacity">
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
