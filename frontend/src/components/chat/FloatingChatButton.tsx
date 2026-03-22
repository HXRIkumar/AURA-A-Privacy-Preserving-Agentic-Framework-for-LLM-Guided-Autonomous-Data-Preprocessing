import React from 'react';
import { Fab, Badge } from '@mui/material';
import { Chat as ChatIcon } from '@mui/icons-material';
import { useChat } from '../../context/ChatContext';

const FloatingChatButton: React.FC = () => {
  const { toggleChat, messages } = useChat();

  // Count unread messages (simplified - just show count)
  const unreadCount = messages.filter((m) => m.role === 'assistant').length;

  return (
    <Fab
      color="primary"
      aria-label="chat"
      onClick={toggleChat}
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 1000,
      }}
    >
      <Badge badgeContent={unreadCount} color="error">
        <ChatIcon />
      </Badge>
    </Fab>
  );
};

export default FloatingChatButton;
