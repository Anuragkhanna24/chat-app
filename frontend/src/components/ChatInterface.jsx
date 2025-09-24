import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, File } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { messagesAPI } from '../services/api';
import { formatTime } from '../utils/formatTime';

const ChatInterface = ({ selectedUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (selectedUser) {
      loadMessages();
    }
  }, [selectedUser]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleReceiveMessage = (message) => {
      if (message.sender._id === selectedUser?._id) {
        setMessages(prev => [...prev, message]);
      }
    };

    const handleTypingStart = (data) => {
      if (data.senderId === selectedUser?._id) {
        setTyping(true);
      }
    };

    const handleTypingStop = (data) => {
      if (data.senderId === selectedUser?._id) {
        setTyping(false);
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('typing_start', handleTypingStart);
    socket.on('typing_stop', handleTypingStop);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('typing_start', handleTypingStart);
      socket.off('typing_stop', handleTypingStop);
    };
  }, [socket, isConnected, selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    try {
      const response = await messagesAPI.getMessages(selectedUser._id);
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    const messageData = {
      receiverId: selectedUser._id,
      content: newMessage.trim()
    };

    try {
      if (socket && isConnected) {
        socket.emit('send_message', messageData);
      }
      
      const response = await messagesAPI.sendMessage(messageData);
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleTyping = () => {
    if (!socket || !isConnected || !selectedUser) return;

    socket.emit('typing_start', {
      receiverId: selectedUser._id,
      senderId: user.id
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', {
        receiverId: selectedUser._id,
        senderId: user.id
      });
    }, 1000);
  };

  const handleFileUpload = async (file) => {
    if (!file || !selectedUser) return;

    setUploading(true);
    try {
      const uploadResponse = await messagesAPI.uploadFile(file);
      const { fileUrl, fileName, fileType } = uploadResponse.data;

      const messageData = {
        receiverId: selectedUser._id,
        fileUrl,
        fileName,
        fileType,
        content: `Sent a ${fileType}`
      };

      if (socket && isConnected) {
        socket.emit('send_message', messageData);
      }

      await messagesAPI.sendMessage(messageData);
      loadMessages(); // Reload messages to include the new file
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const renderFileMessage = (message) => {
    if (message.fileType === 'image') {
      return (
        <img
          src={`http://localhost:5000${message.fileUrl}`}
          alt={message.fileName}
          className="max-w-xs max-h-64 rounded-lg cursor-pointer"
          onClick={() => window.open(`http://localhost:5000${message.fileUrl}`)}
        />
      );
    } else if (message.fileType === 'video') {
      return (
        <video
          controls
          className="max-w-xs max-h-64 rounded-lg"
          src={`http://localhost:5000${message.fileUrl}`}
        />
      );
    } else {
      return (
        <a
          href={`http://localhost:5000${message.fileUrl}`}
          download={message.fileName}
          className="flex items-center p-2 bg-blue-50 rounded-lg hover:bg-blue-100"
        >
          <File className="h-4 w-4 mr-2" />
          <span className="text-sm">{message.fileName}</span>
        </a>
      );
    }
  };

  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Select a user to start chatting</h3>
          <p className="text-gray-500">Choose a contact from the sidebar to begin your conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="relative">
              <img
                className="h-10 w-10 rounded-full"
                src={selectedUser.avatar || `https://ui-avatars.com/api/?name=${selectedUser.name}&background=random`}
                alt={selectedUser.name}
              />
              <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                selectedUser.isOnline ? 'bg-green-500' : 'bg-gray-400'
              }`} />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-900">{selectedUser.name}</h2>
              <p className="text-sm text-gray-500">
                {selectedUser.isOnline ? 'Online' : `Last seen ${formatTime(selectedUser.lastSeen)}`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-500">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

   
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50 scrollbar-thin">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message._id}
                className={`flex ${message.sender._id === user.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender._id === user.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  {message.fileUrl ? (
                    renderFileMessage(message)
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                  <p className={`text-xs mt-1 ${
                    message.sender._id === user.id ? 'text-indigo-200' : 'text-gray-500'
                  }`}>
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <form onSubmit={handleSendMessage} className="flex space-x-4">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,video/*,.pdf,.doc,.docx"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || !isConnected}
            className="flex-shrink-0 inline-flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            title={!isConnected ? "Not connected to server" : "Attach file"}
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
            ) : (
              <Paperclip className="h-5 w-5 text-gray-600" />
            )}
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder={!isConnected ? "Connecting to server..." : "Type a message..."}
              disabled={!isConnected}
              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
            />
          </div>
          
          <button
            type="submit"
            disabled={!newMessage.trim() || uploading || !isConnected}
            className="flex-shrink-0 inline-flex items-center justify-center h-10 w-10 rounded-full bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            title={!isConnected ? "Not connected to server" : "Send message"}
          >
            <Send className="h-5 w-5 text-white" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;