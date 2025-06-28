// components/ConversationSidebar.jsx
import React, { useState, useEffect } from 'react';
import { ConversationService } from '../../../data/conversationService';

const ConversationSidebar = ({ 
  currentConversationId, 
  onConversationSelect, 
  onNewConversation,
  isOpen,
  onToggle 
}) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load conversations when component mounts
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await ConversationService.getConversations();
      setConversations(data);
      setError('');
    } catch (err) {
      setError('Failed to load conversations');
      console.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = async () => {
    try {
      const newConv = await ConversationService.createConversation();
      setConversations(prev => [newConv, ...prev]);
      onNewConversation(newConv.id);
    } catch (err) {
      setError('Failed to create new conversation');
      console.error('Error creating conversation:', err);
    }
  };

  const handleDeleteConversation = async (conversationId, e) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    try {
      await ConversationService.deleteConversation(conversationId);
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      // If we deleted the current conversation, create a new one
      if (conversationId === currentConversationId) {
        handleNewConversation();
      }
    } catch (err) {
      setError('Failed to delete conversation');
      console.error('Error deleting conversation:', err);
    }
  };

  const handleEditTitle = (conversation, e) => {
    e.stopPropagation();
    setEditingId(conversation.id);
    setEditTitle(conversation.title);
  };

  const handleSaveTitle = async (conversationId) => {
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }

    try {
      await ConversationService.updateConversationTitle(conversationId, editTitle.trim());
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, title: editTitle.trim() }
            : conv
        )
      );
      setEditingId(null);
    } catch (err) {
      setError('Failed to update conversation title');
      console.error('Error updating title:', err);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && !isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-gray-900 text-white z-50 transition-all duration-300 ease-in-out
        ${isOpen && !isCollapsed ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'w-12' : 'w-80'}
        md:relative
      `}>
        {/* Header with toggle button */}
        <div className={`p-2 border-b border-gray-700 ${isCollapsed ? 'px-2' : 'px-4'}`}>
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <h2 className="text-lg font-semibold">Chats</h2>
            )}
            <button
              onClick={isCollapsed ? toggleCollapse : (window.innerWidth >= 768 ? toggleCollapse : onToggle)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                // Expand icon (sidebar panel)
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8M4 18h16" />
                </svg>
              ) : (
                // Collapse icon (close panel)
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              )}
            </button>
          </div>

          {/* New Chat Button */}
          {!isCollapsed && (
            <button
              onClick={handleNewConversation}
              className="w-full mt-3 bg-transparent border border-gray-600 hover:bg-gray-800 text-white py-2.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New chat
            </button>
          )}

          {/* Search */}
          {!isCollapsed && (
            <div className="mt-3">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search chats"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-800 text-white pl-10 pr-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-600 placeholder-gray-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* Collapsed state - show only new chat button */}
        {isCollapsed && (
          <div className="p-2">
            <button
              onClick={handleNewConversation}
              className="w-full bg-transparent border border-gray-600 hover:bg-gray-800 text-white p-2 rounded-lg transition-colors flex items-center justify-center"
              title="New chat"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        )}

        {/* Conversations List */}
        {!isCollapsed && (
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-400">Loading...</div>
            ) : error ? (
              <div className="p-4 text-center text-red-400 text-sm">{error}</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">
                {searchQuery ? 'No chats found' : 'No chats yet'}
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => onConversationSelect(conversation.id)}
                    className={`
                      group relative p-3 rounded-lg cursor-pointer transition-all duration-200
                      ${currentConversationId === conversation.id 
                        ? 'bg-gray-800 border-l-2 border-blue-500' 
                        : 'hover:bg-gray-800'
                      }
                    `}
                  >
                    {editingId === conversation.id ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveTitle(conversation.id);
                          } else if (e.key === 'Escape') {
                            handleCancelEdit();
                          }
                        }}
                        onBlur={() => handleSaveTitle(conversation.id)}
                        className="w-full bg-gray-700 text-white px-2 py-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span className="text-sm text-gray-200 truncate font-medium">
                              {conversation.title}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons - show on hover */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                          <button
                            onClick={(e) => handleEditTitle(conversation, e)}
                            className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
                            title="Rename"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => handleDeleteConversation(conversation.id, e)}
                            className="p-1.5 hover:bg-red-600 rounded text-gray-400 hover:text-white transition-colors"
                            title="Delete"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default ConversationSidebar;