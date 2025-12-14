import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, Message } from '../types';
import { Send, Search, MoreVertical, Hash, User as UserIcon, Check, CheckCheck, MessageCircle, Mail, Phone } from 'lucide-react';
import { 
    Box, 
    TextField, 
    Typography, 
    Avatar, 
    Badge, 
    IconButton,
    InputAdornment,
    Divider,
    Tooltip,
    Button,
    Grid,
    Paper,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Stack
} from '@mui/material';

interface Props {
  currentUser: User | null;
  users: User[];
  messages: Message[];
  onSendMessage: (text: string, receiverId: string) => void;
}

// Debounce utility function
const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeout: NodeJS.Timeout;
  return function(this: any, ...args: any[]) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
};

// Helper to get user details - moved outside for memoization
const getUser = (id: string, users: User[]) => users.find(u => u.id === id);

interface UserListItemProps {
    user: User;
    activeChatId: string;
    currentUser: User | null;
    messages: Message[];
    setActiveChatId: (id: string) => void;
}

const UserListItem: React.FC<UserListItemProps> = React.memo(({ user, activeChatId, currentUser, messages, setActiveChatId }) => {
    const unreadCount = messages.filter(m => m.senderId === user.id && m.receiverId === currentUser?.id && !m.read).length;
    return (
        <ListItemButton 
            key={user.id} 
            selected={activeChatId === user.id} 
            onClick={() => setActiveChatId(user.id)}
            sx={{ px: 3 }}
        >
            <ListItemIcon><Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>{user.name.charAt(0)}</Avatar></ListItemIcon>
            <ListItemText primary={user.name} />
            <Badge badgeContent={unreadCount} color="error" />
        </ListItemButton>
    );
});

interface MessageBubbleProps {
    message: Message;
    currentUser: User | null;
    users: User[]; // Pass users to the bubble to get sender info
}

const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({ message, currentUser, users }) => {
    const sender = getUser(message.senderId, users);
    const isCurrentUser = message.senderId === currentUser?.id;
    return (
        <Box sx={{ 
            display: 'flex', 
            justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
        }}>
            {!isCurrentUser && (
                <Avatar sx={{ width: 30, height: 30, mr: 1, mt: 'auto', mb: 0 }}>{sender?.name.charAt(0)}</Avatar>
            )}
            <Box sx={{ 
                maxWidth: '70%', 
                p: 1.5, 
                borderRadius: 3, 
                bgcolor: isCurrentUser ? 'primary.main' : 'background.paper', 
                color: isCurrentUser ? 'white' : 'text.primary',
                boxShadow: 1
            }}>
                {!isCurrentUser && <Typography variant="caption" fontWeight="bold" sx={{ mb: 0.5, display: 'block' }}>{sender?.name}</Typography>}
                <Typography variant="body2">{message.content}</Typography>
                <Typography variant="caption" sx={{ display: 'block', textAlign: isCurrentUser ? 'right' : 'left', mt: 0.5, color: isCurrentUser ? 'rgba(255,255,255,0.7)' : 'text.secondary' }}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isCurrentUser && (message.read ? <Box component="span" sx={{ ml: 5, verticalAlign: 'middle' }}><CheckCheck size={14} /></Box> : <Box component="span" sx={{ ml: 5, verticalAlign: 'middle' }}><Check size={14} /></Box>)}
                </Typography>
            </Box>
             {isCurrentUser && (
                <Avatar sx={{ width: 30, height: 30, ml: 1, mt: 'auto', mb: 0 }}>{sender?.name.charAt(0)}</Avatar>
            )}
        </Box>
    );
});


const MessagesModule: React.FC<Props> = ({ currentUser, users, messages, onSendMessage }) => {
  const [activeChatId, setActiveChatId] = useState<string>('general');
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [displaySearchTerm, setDisplaySearchTerm] = useState(''); // New state for input value
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Validation state
  const [messageInputError, setMessageInputError] = useState('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]); // Removed activeChatId as it's not directly needed for scroll

  // Initial Greeting
  useEffect(() => {
    if (messages.length === 0) {
        // This logic is likely intended to be part of the AIChatModal or App.tsx initial setup
        // For MessagesModule, it should display existing messages or a default empty state
        // Keeping it commented out or removed for now to avoid side effects.
        /*
        setMessages([
            {
                role: 'model',
                text: `Hello! I'm your AI assistant for project **${project.code}**. \n\nYou can:\n• Upload **RFI PDFs** to extract details (Status, Location, Date).\n• Upload Site Photos/Videos for progress analysis.\n• Ask about the project schedule or BOQ status.`
            }
        ]);
        */
    }
  }, [messages]); // Removed project.code from dependency

  const getFilteredMessages = () => {
      if (activeChatId === 'general') {
          return messages.filter(m => m.receiverId === 'general');
      }
      // Direct messages between current user and selected user
      return messages.filter(m => 
          (m.senderId === currentUser?.id && m.receiverId === activeChatId) ||
          (m.senderId === activeChatId && m.receiverId === currentUser?.id)
      );
  };

  const activeMessages = getFilteredMessages();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (e.target.value.trim()) {
      setMessageInputError('');
    }
  };

  const handleSend = (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputText.trim()) {
        setMessageInputError('Message cannot be empty.');
        return;
      }
      // Original logic for sending message
      onSendMessage(inputText, activeChatId);
      setInputText('');
      setMessageInputError('');
  };

  const debouncedSetSearchTerm = useCallback(
    debounce((value: string) => {
      setSearchTerm(value);
    }, 300), 
    []
  );

  const handleDisplaySearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplaySearchTerm(e.target.value);
    debouncedSetSearchTerm(e.target.value);
  };

  const filteredUsers = users.filter(u => 
      u.id !== currentUser?.id && 
      u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleWhatsAppClick = (phone?: string) => {
      if (!phone) {
          alert("No phone number available for this user.");
          return;
      }
      // Simple sanitize
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const handleEmailClick = (email?: string) => {
      if (!email) {
          alert("No email address available for this user.");
          return;
      }
      window.location.href = `mailto:${email}`;
  };

  const activeUser = getUser(activeChatId, users); // Use the global getUser

  return (
    <Grid container sx={{ height: 'calc(100vh - 160px)', overflow: 'hidden' }}>
      <Grid item xs={12} sm={4} md={3} sx={{ display: 'flex', flexDirection: 'column', borderRight: 1, borderColor: 'divider' }}>
        <Box p={2} borderBottom={1} borderColor="divider">
          <Typography variant="h6" fontWeight="bold" gutterBottom>Messages</Typography>
          <TextField 
            size="small" 
            placeholder="Search people..." 
            fullWidth 
            value={displaySearchTerm} 
            onChange={handleDisplaySearchTermChange} 
            InputProps={{ startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment> }}
          />
        </Box>
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          {/* General Chat */}
          <ListItemButton 
            selected={activeChatId === 'general'}
            onClick={() => setActiveChatId('general')}
            sx={{ px: 3 }}
          >
            <ListItemIcon><Hash size={20} /></ListItemIcon>
            <ListItemText primary="General" />
            <Badge badgeContent={messages.filter(m => m.receiverId === 'general' && !m.read).length} color="error" />
          </ListItemButton>
          <Divider />
          {/* User List */}
          {filteredUsers.map(user => (
              <UserListItem
                key={user.id} 
                user={user}
                activeChatId={activeChatId}
                currentUser={currentUser}
                messages={messages}
                setActiveChatId={setActiveChatId}
              />
          ))}
        </Box>
      </Grid>
      <Grid item xs={12} sm={8} md={9} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Paper sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={1}>
                  {activeChatId === 'general' ? <Hash size={20} /> : <Avatar sx={{ width: 30, height: 30, fontSize: 14 }}>{activeUser?.name.charAt(0)}</Avatar>}
                  <Typography variant="h6" fontWeight="bold">{activeUser?.name || 'General'}</Typography>
              </Box>
              <Box>
                  {activeChatId !== 'general' && activeUser && (
                      <>
                          <Tooltip title="Start WhatsApp Chat">
                              <IconButton onClick={() => handleWhatsAppClick(activeUser.phone)} aria-label="Start WhatsApp chat" size="small" sx={{ minWidth: { xs: 44, md: 'auto' }, minHeight: { xs: 44, md: 'auto' } }}><Phone size={20} /></IconButton>
                          </Tooltip>
                          <Tooltip title="Send Email">
                              <IconButton onClick={() => handleEmailClick(activeUser.email)} aria-label="Send email" size="small" sx={{ minWidth: { xs: 44, md: 'auto' }, minHeight: { xs: 44, md: 'auto' } }}><Mail size={20} /></IconButton>
                          </Tooltip>
                      </>
                  )}
                  <IconButton aria-label="More chat options" size="small" sx={{ minWidth: { xs: 44, md: 'auto' }, minHeight: { xs: 44, md: 'auto' } }}><MoreVertical size={20} /></IconButton>
              </Box>
          </Box>
        </Paper>
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, bgcolor: 'action.hover' }}>
          <Stack spacing={2}>
              {activeMessages.map((m, index) => (
                  <MessageBubble
                      key={index} // Use index as key if message id is not unique, or prefer message.id if available
                      message={m}
                      currentUser={currentUser}
                      users={users} // Pass users to the bubble
                  />
              ))}
              <div ref={messagesEndRef} />
          </Stack>
        </Box>
        <Paper sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Type your message..."
              value={inputText}
              onChange={handleInputChange}
              error={!!messageInputError}
              helperText={messageInputError}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton type="submit" color="primary" disabled={!inputText.trim() || !!messageInputError} aria-label="Send message" size="small" sx={{ minWidth: { xs: 44, md: 'auto' }, minHeight: { xs: 44, md: 'auto' } }}>
                      <Send />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </form>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default MessagesModule;
