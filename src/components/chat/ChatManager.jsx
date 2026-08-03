import React, { useState, createContext, useContext } from "react";
import { AnimatePresence } from "framer-motion";
import ChatWindow from "./ChatWindow";

const ChatContext = createContext(null);

export function useChatManager() {
  return useContext(ChatContext);
}

export default function ChatManager({ children }) {
  const [openChats, setOpenChats] = useState([]);

  const openChat = ({ contextType, contextId, contextTitle }) => {
    const conversationId = `${contextType}_${contextId}`;
    setOpenChats((prev) => {
      if (prev.find((c) => c.conversationId === conversationId)) return prev;
      // Max 2 chats abiertos a la vez en desktop
      const next = [...prev, { conversationId, contextType, contextId, contextTitle }];
      return next.slice(-2);
    });
  };

  const closeChat = (conversationId) => {
    setOpenChats((prev) => prev.filter((c) => c.conversationId !== conversationId));
  };

  return (
    <ChatContext.Provider value={{ openChat }}>
      {children}
      {/* Floating chat windows — bottom right */}
      <div className="fixed bottom-4 right-4 z-50 flex gap-3 items-end">
        <AnimatePresence>
          {openChats.map((chat) => (
            <ChatWindow
              key={chat.conversationId}
              {...chat}
              onClose={() => closeChat(chat.conversationId)}
            />
          ))}
        </AnimatePresence>
      </div>
    </ChatContext.Provider>
  );
}