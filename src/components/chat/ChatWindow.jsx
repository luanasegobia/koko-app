const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send, MessageCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function ChatWindow({ conversationId, contextType, contextId, contextTitle, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    db.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    const load = () =>
      db.entities.ChatMessage.filter({ conversation_id: conversationId }, "created_date", 100)
        .then(setMessages);
    load();
    const unsub = db.entities.ChatMessage.subscribe((event) => {
      if (event.data?.conversation_id !== conversationId) return;
      if (event.type === "create") setMessages((prev) => [...prev, event.data]);
    });
    return unsub;
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!text.trim() || !currentUser) return;
    setSending(true);
    await db.entities.ChatMessage.create({
      conversation_id: conversationId,
      context_type: contextType,
      context_id: contextId,
      context_title: contextTitle,
      sender_id: currentUser.id,
      sender_name: currentUser.full_name || "Usuario",
      text: text.trim(),
      read_by: [currentUser.id],
    });
    setText("");
    setSending(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const contextColors = {
    lost_pet: "bg-destructive/10 text-destructive",
    urgent_case: "bg-rose-500/10 text-rose-600",
    adoption: "bg-primary/10 text-primary",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="flex flex-col bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
      style={{ width: 340, height: 480 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-sidebar border-b border-sidebar-border">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${contextColors[contextType] || "bg-muted"}`}>
          <MessageCircle className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sidebar-foreground font-semibold text-sm truncate">{contextTitle}</p>
          <p className="text-sidebar-foreground/50 text-xs capitalize">{contextType === "lost_pet" ? "Mascota perdida" : contextType === "urgent_case" ? "Caso urgente" : "Adopción"}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-sidebar-foreground/60 hover:text-sidebar-foreground h-7 w-7">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <MessageCircle className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-sm">Iniciá la conversación para coordinar.</p>
          </div>
        )}
        <div className="space-y-3">
          {messages.map((msg) => {
            const isMe = currentUser && msg.sender_id === currentUser.id;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                {!isMe && (
                  <span className="text-xs text-muted-foreground mb-1 px-1">{msg.sender_name}</span>
                )}
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"}`}>
                  {msg.text}
                </div>
                <span className="text-[10px] text-muted-foreground mt-0.5 px-1">
                  {msg.created_date ? formatDistanceToNow(new Date(msg.created_date), { addSuffix: true, locale: es }) : ""}
                </span>
              </div>
            );
          })}
        </div>
        <div ref={bottomRef} />
      </ScrollArea>

      {/* Input */}
      <div className="px-3 py-3 border-t border-border flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Escribí un mensaje..."
          className="flex-1 text-sm h-9"
          disabled={!currentUser}
        />
        <Button size="icon" className="h-9 w-9 flex-shrink-0" onClick={send} disabled={!text.trim() || sending || !currentUser}>
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </motion.div>
  );
}