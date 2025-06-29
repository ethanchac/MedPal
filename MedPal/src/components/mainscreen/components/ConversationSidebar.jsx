// components/ConversationSidebar.jsx
import React, { useState, useEffect } from 'react';
import { ConversationService } from '../../../data/conversationService';
import MedPalLogo from '../../../assets/MedPal2.png';




const ConversationSidebar = ({
 currentConversationId,
 onConversationSelect,
 onNewConversation,
 isOpen,
 onToggle,
 isCollapsed,
 onToggleCollapse
}) => {
 const [conversations, setConversations] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');
 const [searchQuery, setSearchQuery] = useState('');
 const [editingId, setEditingId] = useState(null);
 const [editTitle, setEditTitle] = useState('');




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
   }
 };




 const handleDeleteConversation = async (conversationId, e) => {
   e.stopPropagation();
   if (!window.confirm('Delete this conversation?')) return;




   try {
     await ConversationService.deleteConversation(conversationId);
     setConversations(prev => prev.filter(conv => conv.id !== conversationId));
     if (conversationId === currentConversationId) {
       handleNewConversation();
     }
   } catch (err) {
     setError('Failed to delete conversation');
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
   } catch {
     setError('Failed to update title');
   }
 };




 const handleToggleCollapse = () => {
   if (onToggleCollapse) {
     onToggleCollapse(!isCollapsed);
   }
 };




 const filteredConversations = conversations.filter(conv =>
   conv.title.toLowerCase().includes(searchQuery.toLowerCase())
 );




 return (
   <>
     {isOpen && !isCollapsed && (
       <div
         className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
         onClick={onToggle}
       />
     )}




     <div className={`
       fixed top-0 left-0 z-50 transition-all duration-300 ease-in-out
       ${isOpen && !isCollapsed ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
       ${isCollapsed ? 'w-12' : 'w-80'}
       md:relative
       bg-[#B0101C] text-white
       flex flex-col
       h-full overflow-hidden
     `}>
       <div className={`p-2 border-b border-red-800 ${isCollapsed ? 'px-2' : 'px-4'}`}>
         <div className="flex items-center justify-between">
           {!isCollapsed && (
             <img
               src={MedPalLogo}
               alt="MedPal Logo"
               className="h-10 w-auto"
             />
           )}
           <button
             onClick={isCollapsed ? handleToggleCollapse : (window.innerWidth >= 768 ? handleToggleCollapse : onToggle)}
             className="p-2 hover:bg-red-800 rounded-lg transition-colors"
             title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
           >
             {isCollapsed ? (
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8M4 18h16" />
               </svg>
             ) : (
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
               </svg>
             )}
           </button>
         </div>




         {!isCollapsed && (
           <>
             <button
               onClick={handleNewConversation}
               className="w-full mt-3 bg-transparent border border-red-700 hover:bg-red-800 text-white py-2.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
               </svg>
               New chat
             </button>




             <div className="mt-3">
               <div className="relative">
                 <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                 </svg>
                 <input
                   type="text"
                   placeholder="Search chats"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full bg-red-700 text-white pl-10 pr-3 py-2.5 rounded-lg text-sm placeholder-red-200 focus:outline-none focus:ring-1 focus:ring-white"
                 />
               </div>
             </div>
           </>
         )}
       </div>




       {isCollapsed && (
         <div className="p-2">
           <button
             onClick={handleNewConversation}
             className="w-full border border-red-700 hover:bg-red-800 text-white p-2 rounded-lg transition-colors"
             title="New chat"
           >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
             </svg>
           </button>
         </div>
       )}




       {!isCollapsed && (
         <div className="flex-1 overflow-y-auto p-2">
           {loading ? (
             <div className="p-4 text-center text-red-200">Loading...</div>
           ) : error ? (
             <div className="p-4 text-center text-red-300 text-sm">{error}</div>
           ) : filteredConversations.length === 0 ? (
             <div className="p-4 text-center text-red-200 text-sm">
               {searchQuery ? 'No chats found' : 'No chats yet'}
             </div>
           ) : (
             <div className="space-y-1">
               {filteredConversations.map((conversation) => (
                 <div
                   key={conversation.id}
                   onClick={() => onConversationSelect(conversation.id)}
                   className={`
                     group relative p-3 rounded-lg cursor-pointer transition-all duration-200
                     ${currentConversationId === conversation.id
                       ? 'bg-red-800 border-l-4 border-white'
                       : 'hover:bg-red-700'
                     }
                   `}
                 >
                   {editingId === conversation.id ? (
                     <input
                       type="text"
                       value={editTitle}
                       onChange={(e) => setEditTitle(e.target.value)}
                       onKeyDown={(e) => {
                         if (e.key === 'Enter') handleSaveTitle(conversation.id);
                         else if (e.key === 'Escape') setEditingId(null);
                       }}
                       onBlur={() => handleSaveTitle(conversation.id)}
                       className="w-full bg-red-600 text-white px-2 py-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-white"
                       autoFocus
                     />
                   ) : (
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                         <svg className="w-4 h-4 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                         </svg>
                         <span className="text-sm truncate">{conversation.title}</span>
                       </div>
                       <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                         <button
                           onClick={(e) => handleEditTitle(conversation, e)}
                           className="p-1 hover:bg-red-600 rounded text-white"
                         >
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                           </svg>
                         </button>
                         <button
                           onClick={(e) => handleDeleteConversation(conversation.id, e)}
                           className="p-1 hover:bg-red-600 rounded text-white"
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











