'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setMessagesForChat, addMessageToChat, ChatMessage, updateMessageInChat, deleteMessageInChat, setActiveChat } from '../../store/slices/chatSlice';
import { setRightPanelOpen, toggleSidebar } from '../../store/slices/uiSlice';
import apiClient from '../../utils/apiClient';
import { useSocket } from '../../hooks/useSocket';
import {
  Send,
  Paperclip,
  Smile,
  Info,
  CornerDownRight,
  Edit2,
  Trash2,
  Star,
  Check,
  CheckCheck,
  X,
  MessageCircle,
  Pin,
  Menu,
  ChevronLeft
} from 'lucide-react';

export default function ChatWindow() {
  const dispatch = useDispatch();
  const socketProps = useSocket();
  
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const activeChatId = useSelector((state: RootState) => state.chat.activeChatId);
  const threads = useSelector((state: RootState) => state.chat.threads);
  const messagesMap = useSelector((state: RootState) => state.chat.messages);
  const typingUsers = useSelector((state: RootState) => state.chat.typingUsers);
  const rightPanelOpen = useSelector((state: RootState) => state.ui.rightPanelOpen);

  const activeChat = threads.find(t => t._id === activeChatId);
  const messages = activeChatId ? messagesMap[activeChatId] || [] : [];
  const typers = activeChatId ? typingUsers[activeChatId] || [] : [];

  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInputVal, setEditInputVal] = useState('');
  const [uploadedFile, setUploadedFile] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);

  // Thread State
  const [threadParent, setThreadParent] = useState<ChatMessage | null>(null);
  const [threadReplies, setThreadReplies] = useState<ChatMessage[]>([]);
  const [threadInput, setThreadInput] = useState('');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load chat messages
  useEffect(() => {
    if (!activeChatId) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/chats/${activeChatId}/messages`);
        dispatch(setMessagesForChat({ chatId: activeChatId, messages: res.data }));
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    setThreadParent(null); // Close thread side panel on chat change
  }, [activeChatId, dispatch]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typers]);

  // Handle typing indicator trigger
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputVal(e.target.value);
    if (activeChatId) {
      if (e.target.value.trim() !== '') {
        socketProps.sendTyping(activeChatId);
      } else {
        socketProps.sendStopTyping(activeChatId);
      }
    }
  };

  // Handle send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() && !uploadedFile) return;

    if (activeChatId) {
      socketProps.sendStopTyping(activeChatId);
      socketProps.sendMessage(
        activeChatId,
        inputVal,
        uploadedFile ? [uploadedFile._id] : undefined
      );
      setInputVal('');
      setUploadedFile(null);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('accessType', 'private'); // Private context for direct message attachments
    if (activeChatId) {
      formData.append('targetId', activeChatId);
    }

    try {
      setUploading(true);
      const res = await apiClient.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadedFile(res.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  // Open thread panel
  const handleOpenThread = async (msg: ChatMessage) => {
    setThreadParent(msg);
    try {
      const res = await apiClient.get(`/messages/${msg._id}/replies`);
      setThreadReplies(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Listen for socket events to update thread replies live
  useEffect(() => {
    if (!socketProps.socket || !threadParent) return;

    const handleNewSocketMessage = (msg: any) => {
      if (msg.parentMessageId === threadParent._id) {
        setThreadReplies(prev => [...prev, msg]);
      }
    };

    socketProps.socket.on('message', handleNewSocketMessage);
    return () => {
      socketProps.socket?.off('message', handleNewSocketMessage);
    };
  }, [socketProps.socket, threadParent]);

  // Send Thread Reply
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadInput.trim() || !threadParent || !activeChatId) return;

    socketProps.sendMessage(
      activeChatId,
      threadInput,
      undefined,
      threadParent._id
    );
    setThreadInput('');
  };

  // Start Edit message
  const startEdit = (msg: ChatMessage) => {
    setEditingMessageId(msg._id);
    setEditInputVal(msg.content);
  };

  // Submit message edit
  const submitEdit = (messageId: string) => {
    if (!editInputVal.trim()) return;
    if (socketProps.socket) {
      socketProps.socket.emit('edit_message', { messageId, content: editInputVal });
    }
    setEditingMessageId(null);
  };

  // Delete message
  const deleteMessage = (messageId: string) => {
    if (confirm('Are you sure you want to delete this message?')) {
      if (socketProps.socket) {
        socketProps.socket.emit('delete_message', messageId);
      }
    }
  };

  // Add reaction
  const reactToMessage = (messageId: string, emoji: string) => {
    socketProps.sendReaction(messageId, emoji);
  };

  if (!activeChatId || !activeChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background text-text-secondary p-6 h-full w-full">
        {/* Hamburger Menu on mobile when empty */}
        <div className="lg:hidden absolute top-4 left-4">
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="p-2.5 bg-bg-secondary border border-border-custom rounded-xl text-text-secondary hover:text-text-primary cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
        <MessageCircle className="w-24 h-24 text-indigo-500/20 mb-6 animate-pulse" />
        <p className="text-base lg:text-lg font-bold tracking-wider uppercase text-center text-text-secondary">Select a conversation to start collaborating</p>
      </div>
    );
  }

  const isDirect = activeChat.type === 'direct';
  const chatName = isDirect
    ? activeChat.participants.find(p => p._id !== currentUser?._id)?.name || 'Direct Message'
    : activeChat.type === 'group'
    ? activeChat.name
    : activeChat.type === 'department'
    ? `${activeChat.department?.name} Channel`
    : activeChat.team?.name;

  return (
    <div className="flex-1 flex h-full min-w-0 bg-bg-primary">
      {/* Messages Workspace */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        
        {/* Header */}
        <div className="h-20 border-b border-border-custom flex items-center justify-between px-4 lg:px-6 bg-bg-tertiary shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Back button (Mobile only) */}
            <button
              onClick={() => dispatch(setActiveChat(null))}
              className="lg:hidden p-1.5 hover:bg-bg-tertiary rounded-lg text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
              title="Back to Chats"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Hamburger Menu (Mobile only) */}
            <button
              onClick={() => dispatch(toggleSidebar())}
              className="lg:hidden p-1.5 hover:bg-bg-tertiary rounded-lg text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Round Active Chat Avatar */}
            <div className="w-10 h-10 rounded-full bg-bg-tertiary border border-border-custom flex items-center justify-center shrink-0 overflow-hidden">
              {activeChat.type === 'direct' && activeChat.participants.find(p => p._id !== currentUser?._id)?.avatar ? (
                <img src={activeChat.participants.find(p => p._id !== currentUser?._id).avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="text-sm font-bold text-indigo-400">
                  {chatName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <h4 className="text-base font-bold text-text-primary tracking-wide truncate leading-tight">{chatName}</h4>
              <p className="text-xs text-text-secondary mt-0.5 font-semibold leading-tight">
                {activeChat.type === 'direct' && activeChat.participants.find(p => p._id !== currentUser?._id)?.isOnline ? (
                  <span className="text-emerald-550">online</span>
                ) : activeChat.type === 'direct' ? (
                  'offline'
                ) : (
                  `${activeChat.participants.length} members`
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => dispatch(setRightPanelOpen(!rightPanelOpen))}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                rightPanelOpen ? 'bg-indigo-500/10 text-indigo-400' : 'text-text-secondary hover:bg-bg-tertiary'
              }`}
            >
              <Info className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Message Logs */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 chat-wallpaper">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-sm text-text-secondary">
              No messages yet. Send a message to start the conversation!
            </div>
          ) : (
            messages.map(msg => {
              const isMe = msg.sender._id === currentUser?._id;
              const hasReactions = msg.reactions && msg.reactions.length > 0;

              return (
                <div key={msg._id} className={`flex gap-3 group/msg ${isMe ? 'justify-end' : ''}`}>
                  {/* Sender Avatar */}
                  {!isMe && (
                    <div className="shrink-0 w-12 h-12 rounded-lg bg-bg-secondary border border-border-custom flex items-center justify-center font-bold text-base text-indigo-400">
                      {msg.sender.avatar ? (
                        <img src={msg.sender.avatar} alt="avatar" className="w-full h-full rounded-lg" />
                      ) : (
                        msg.sender.name.charAt(0)
                      )}
                    </div>
                  )}

                  {/* Bubble body */}
                  <div className={`max-w-[80%] lg:max-w-[70%] flex flex-col ${isMe ? 'items-end' : ''}`}>
                    {/* Meta info */}
                    {!isMe && (
                      <span className="text-xs text-text-secondary font-semibold mb-1">
                        {msg.sender.name} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}

                    {/* Chat Bubble card */}
                    <div
                      className={`rounded-xl px-4 pt-3 pb-5.5 text-sm lg:text-base relative ${
                        isMe
                          ? 'bg-whatsapp-sent text-whatsapp-sent-text rounded-tr-none shadow-sm'
                          : 'bg-whatsapp-received text-whatsapp-received-text border border-border-custom/50 rounded-tl-none shadow-xs'
                      }`}
                    >
                      {/* Editing Message input */}
                      {editingMessageId === msg._id ? (
                        <div className="flex flex-col gap-2 w-64 lg:w-72">
                          <input
                            type="text"
                            value={editInputVal}
                            onChange={(e) => setEditInputVal(e.target.value)}
                            className="w-full bg-bg-primary border border-border-custom text-sm rounded p-3 text-text-primary outline-none focus:border-indigo-500"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingMessageId(null)}
                              className="p-1 hover:bg-bg-tertiary rounded text-text-secondary cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => submitEdit(msg._id)}
                              className="p-1 bg-indigo-600 rounded text-white cursor-pointer"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="whitespace-pre-line leading-relaxed break-words">{msg.content}</p>

                          {/* Attachments */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2.5 space-y-1.5 mb-2">
                              {msg.attachments.map((file: any) => (
                                <a
                                  key={file._id}
                                  href={`http://localhost:5000/api/files/${file._id}/download`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`flex items-center gap-2 p-3 rounded-lg text-sm border ${
                                    isMe
                                      ? 'bg-indigo-650/10 border-indigo-600/25 text-indigo-650 hover:bg-indigo-650/20'
                                      : 'bg-bg-primary border-border-custom/50 text-indigo-650 hover:bg-bg-primary/80'
                                  } transition-colors`}
                                >
                                  <Paperclip className="w-4.5 h-4.5 shrink-0" />
                                  <span className="truncate max-w-[150px] font-medium">{file.originalName}</span>
                                  <span className="text-xs opacity-60">({Math.round(file.size / 1024)} KB)</span>
                                </a>
                              ))}
                            </div>
                          )}

                          {/* Time and Check Ticks absolute at bottom right */}
                          <div className="absolute bottom-1 right-2.5 flex items-center gap-1 select-none pointer-events-none text-text-secondary/70">
                            <span className="text-[10px] opacity-75 font-semibold">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && (
                              <span className="opacity-80">
                                {msg.readBy && msg.readBy.length > 1 ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-sky-500 inline" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 inline" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Msg Actions panel (floating overlay on hover) */}
                      {!msg.isDeleted && editingMessageId !== msg._id && (
                        <div
                          className={`absolute top-0 -translate-y-1/2 hidden group-hover/msg:flex items-center gap-1 bg-bg-secondary border border-border-custom rounded-lg p-1 shadow-lg z-20 ${
                            isMe ? 'right-0' : 'left-0'
                          }`}
                        >
                          {/* Reactions Picker */}
                          <div className="flex gap-0.5 border-r border-border-custom pr-1">
                            {['👍', '❤️', '🔥', '😂'].map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => reactToMessage(msg._id, emoji)}
                                className="hover:scale-125 px-1 text-xs cursor-pointer transition-transform"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={() => handleOpenThread(msg)}
                            title="Reply in thread"
                            className="p-1 hover:bg-bg-tertiary rounded text-text-secondary hover:text-text-primary cursor-pointer"
                          >
                            <CornerDownRight className="w-3.5 h-3.5" />
                          </button>

                          {isMe && (
                            <>
                              <button
                                onClick={() => startEdit(msg)}
                                title="Edit message"
                                className="p-1 hover:bg-bg-tertiary rounded text-text-secondary hover:text-text-primary cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteMessage(msg._id)}
                                title="Delete message"
                                className="p-1 hover:bg-bg-tertiary rounded text-rose-500 hover:text-rose-450 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Displays reactions block */}
                    {hasReactions && (
                      <div className={`flex flex-wrap gap-1.5 mt-1.5 ${isMe ? 'justify-end' : ''}`}>
                        {msg.reactions.map((react, i) => (
                          <span
                            key={i}
                            onClick={() => reactToMessage(msg._id, react.emoji)}
                            className="bg-bg-secondary border border-border-custom rounded-full px-1.5 py-0.5 text-xs cursor-pointer hover:border-indigo-500 transition-colors text-text-primary"
                          >
                            {react.emoji}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing indicators layer */}
        {typers.length > 0 && (
          <div className="px-6 py-2 bg-bg-tertiary border-t border-border-custom text-xs text-text-secondary italic">
            {typers.map(t => t.userName).join(', ')} {typers.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}

        {/* Input message form footer */}
        <div className="p-4 border-t border-border-custom bg-bg-tertiary shrink-0">
          <form onSubmit={handleSendMessage} className="space-y-2">
            {/* Attachment preview chip */}
            {uploadedFile && (
              <div className="flex items-center justify-between bg-bg-secondary border border-border-custom rounded-lg p-3 max-w-xs text-sm text-indigo-650 font-medium">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4.5 h-4.5 shrink-0" />
                  <span className="truncate max-w-[150px]">{uploadedFile.originalName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadedFile(null)}
                  className="text-text-secondary hover:text-rose-500 p-0.5 rounded cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-3">
              {/* Attachment hidden input */}
              <label className="p-3 text-text-secondary hover:text-text-primary rounded-full hover:bg-bg-tertiary cursor-pointer transition-colors relative shrink-0">
                <Paperclip className="w-5.5 h-5.5" />
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
                {uploading && (
                  <span className="absolute inset-0 bg-bg-secondary/80 rounded-full flex items-center justify-center">
                    <span className="w-4.5 h-4.5 border border-indigo-650 border-t-transparent rounded-full animate-spin"></span>
                  </span>
                )}
              </label>

              {/* Text Input */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder={`Type a message`}
                  value={inputVal}
                  onChange={handleInputChange}
                  className="w-full bg-bg-primary border border-border-custom focus:border-indigo-500/30 rounded-xl px-5 py-3 text-sm lg:text-base text-text-primary placeholder-text-secondary/50 outline-none transition-colors"
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="w-11 h-11 bg-indigo-650 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-md shadow-indigo-600/10"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Side thread replies panel */}
      {threadParent && (
        <div className="w-80 lg:w-96 border-l border-border-custom flex flex-col h-full bg-bg-secondary shrink-0 relative z-30">
          <div className="h-20 border-b border-border-custom flex items-center justify-between px-4 bg-bg-tertiary">
            <span className="text-sm font-bold text-text-primary tracking-wide">Thread Replies</span>
            <button
              onClick={() => setThreadParent(null)}
              className="p-1 hover:bg-bg-tertiary rounded text-text-secondary hover:text-text-primary cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Thread Parent post */}
          <div className="p-4 border-b border-border-custom bg-bg-tertiary">
            <span className="text-xs text-text-secondary font-semibold mb-1 block">
              {threadParent.sender.name}
            </span>
            <p className="text-sm text-text-primary leading-relaxed">{threadParent.content}</p>
          </div>

          {/* Thread replies list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {threadReplies.length === 0 ? (
              <div className="text-center py-6 text-xs text-text-secondary">No replies yet.</div>
            ) : (
              threadReplies.map(reply => (
                <div key={reply._id} className="flex gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-bg-secondary flex items-center justify-center font-bold text-xs text-indigo-400 shrink-0 border border-border-custom">
                    {reply.sender.name.charAt(0)}
                  </div>
                  <div>
                    <span className="text-xs text-text-secondary font-semibold">
                      {reply.sender.name} • {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <p className="text-sm text-text-primary mt-0.5 leading-relaxed">{reply.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Thread reply input */}
          <div className="p-4 border-t border-border-custom bg-bg-tertiary">
            <form onSubmit={handleSendReply} className="flex gap-2">
              <input
                type="text"
                placeholder="Reply in thread..."
                value={threadInput}
                onChange={(e) => setThreadInput(e.target.value)}
                className="flex-1 bg-bg-primary border border-border-custom focus:border-indigo-500/50 rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder-slate-650 outline-none"
              />
              <button
                type="submit"
                className="p-2.5 bg-indigo-650 hover:bg-indigo-500 text-white rounded-lg cursor-pointer"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
