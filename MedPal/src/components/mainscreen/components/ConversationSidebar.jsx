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
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-gray-900 text-white z-50 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        w-80 md:relative md:translate-x-0
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Conversations</h2>
            <button
              onClick={onToggle}
              className="md:hidden p-1 hover:bg-gray-700 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <button
            onClick={handleNewConversation}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>

          {/* Search */}
          <div className="mt-4">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-400">Loading conversations...</div>
          ) : error ? (
            <div className="p-4 text-center text-red-400">{error}</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </div>
          ) : (
            <div className="p-2">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => onConversationSelect(conversation.id)}
                  className={`
                    group relative p-3 mb-1 rounded-lg cursor-pointer transition-colors
                    ${currentConversationId === conversation.id 
                      ? 'bg-blue-600' 
                      : 'hover:bg-gray-800'
                    }
                  `}
                >
                  {editingId === conversation.id ? (
                    <div className="flex items-center gap-2">
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
                        className="flex-1 bg-gray-700 text-white px-2 py-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium truncate">
                            {conversation.title}
                          </h3>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(conversation.updated_at)}
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleEditTitle(conversation, e)}
                            className="p-1 hover:bg-gray-700 rounded"
                            title="Edit title"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => handleDeleteConversation(conversation.id, e)}
                            className="p-1 hover:bg-red-600 rounded"
                            title="Delete conversation"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={loadConversations}
            className="w-full text-sm text-gray-400 hover:text-white transition-colors"
          >
            Refresh Conversations
          </button>
        </div>
      </div>
    </>
  );
};

export default ConversationSidebar;