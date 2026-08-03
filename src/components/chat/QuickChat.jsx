import React, { useState, useEffect, useRef } from "react";
import { db } from "@/api/supabaseClient";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";

const GUEST_NAME_KEY = "quick_chat_guest_name";

export default function QuickChat({ contextType, contextId, contextTitle, contextOwnerId, accentClass = "" }) {
  const conversationId = `${contextType}_${contextId}`;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [guestName, setGuestName] = useState(() => localStorage.getItem(GUEST_NAME_KEY) || "");
  const [askName, setAskName] = useState(false);
  const [pendingText, setPendingText] = useState("");
  const bottomRef = useRef(null);

  // Try to get logged-in user
  useEffect(() => {
    db.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  // Load messages + subscribe when open
  useEffect(() => {
    if (!open) return;
    db.entities.ChatMessage
      .filter({ conversation_id: conversationId }, "created_date", 100)
      .then(setMessages);

    const unsub = db.entities.ChatMessage.subscribe((event) => {
      if (event.data?.conversation_id !== conversationId) return;
      if (event.type === "create") setMessages((prev) => [...prev, event.data]);
    });
    return unsub;
  }, [open, conversationId]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const doSend = async (msgText, name) => {
    if (!msgText.trim()) return;
    setSending(true);
    const senderName = currentUser ? (currentUser.full_name || "Usuario") : (name || "Anónimo");
    const senderId = currentUser ? currentUser.id : `guest_${name}_${Date.now()}`;

    await db.entities.ChatMessage.create({
      conversation_id: conversationId,
      context_type: contextType,
      context_id: contextId,
      context_title: contextTitle,
      sender_id: senderId,
      sender_name: senderName,
      text: msgText.trim(),
      read_by: [],
    });

    // Notify the owner of the report (contextOwnerId) if it's not the sender
    if (contextOwnerId && contextOwnerId !== (currentUser?.id)) {
      db.entities.AppNotification.create({
        user_id: contextOwnerId,
        type: "chat_reply",
        title: `💬 Nueva respuesta en "${contextTitle}"`,
        body: `${senderName}: ${msgText.trim().slice(0, 80)}`,
        ref_id: contextId,
        link: contextType === "lost_pet" ? "/perdidas" : "/casos-urgentes",
        read: false,
      }).catch(() => {});
    }

    setText("");
    setSending(false);
  };

  const handleSend = () => {
    if (!text.trim()) return;
    if (!currentUser && !guestName) {
      // Ask for name first
      setPendingText(text);
      setAskName(true);
      return;
    }
    doSend(text, guestName);
  };

  const handleNameConfirm = (name) => {
    const trimmed = name.trim() || "Anónimo";
    setGuestName(trimmed);
    localStorage.setItem(GUEST_NAME_KEY, trimmed);
    setAskName(false);
    doSend(pendingText, trimmed);
    setPendingText("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const unread = messages.length;

  return (
    <div className="border-t border-border">
      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          Chat rápido
          {!open && unread > 0 && (
            <span className="bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 leading-none">
              {unread}
            </span>
          )}
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {/* Messages */}
            <ScrollArea className="h-48 px-4 py-2 bg-muted/30">
              {messages.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-6">
                  Nadie ha escrito aún. ¡Sé el primero en aportar información!
                </p>
              )}
              <div className="space-y-2">
                {messages.map((msg) => {
                  const isMe = currentUser
                    ? msg.sender_id === currentUser.id
                    : msg.sender_id?.startsWith(`guest_${guestName}_`);
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                      {!isMe && (
                        <span className="text-[10px] text-muted-foreground mb-0.5 px-1 font-medium">{msg.sender_name}</span>
                      )}
                      <div className={`max-w-[85%] rounded-xl px-3 py-1.5 text-sm ${isMe ? "bg-primary text-primary-foreground rounded-br-none" : "bg-card border border-border rounded-bl-none"}`}>
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-0.5 px-1">
                        {msg.created_date
                          ? formatDistanceToNow(new Date(msg.created_date), { addSuffix: true, locale: es })
                          : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div ref={bottomRef} />
            </ScrollArea>

            {/* Ask name if guest & first message */}
            <AnimatePresence>
              {askName && (
                <NamePrompt
                  onConfirm={handleNameConfirm}
                  onCancel={() => { setAskName(false); setPendingText(""); }}
                />
              )}
            </AnimatePresence>

            {/* Input */}
            {!askName && (
              <div className="px-3 py-2 border-t border-border flex gap-2 bg-card">
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={currentUser ? "Escribí un mensaje..." : "Aportá información sin registrarte..."}
                  className="flex-1 text-sm h-8"
                />
                <Button
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={handleSend}
                  disabled={!text.trim() || sending}
                >
                  {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                </Button>
              </div>
            )}

            {!currentUser && (
              <p className="text-center text-[10px] text-muted-foreground pb-2 px-4">
                No necesitás cuenta para participar
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NamePrompt({ onConfirm, onCancel }) {
  const [name, setName] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="px-4 py-3 bg-accent/10 border-t border-accent/30 space-y-2"
    >
      <p className="text-sm font-medium">¿Cómo querés que te identifiquen?</p>
      <p className="text-xs text-muted-foreground">Podés poner un apodo o dejarlo vacío para ser "Anónimo"</p>
      <div className="flex gap-2">
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onConfirm(name); if (e.key === "Escape") onCancel(); }}
          placeholder="Tu nombre o apodo..."
          className="flex-1 text-sm h-8"
          maxLength={30}
        />
        <Button size="sm" className="h-8" onClick={() => onConfirm(name)}>Enviar</Button>
      </div>
    </motion.div>
  );
}