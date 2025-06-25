import React, { useState } from 'react';
import { ConversationsList } from '../messages/ConversationsList';
import { useAuthStore } from '../../store/authStore';
import { useRecentConversations } from '../../hooks/useRecentConversations';
import ChatUserModal from './ChatUserModal';
import BottomSheetModal from '../shared/BottomSheetModal';

interface ConversationModalProps {
  open: boolean;
  onClose: () => void;
}

const ConversationModal: React.FC<ConversationModalProps> = ({ open, onClose }) => {
  const { user } = useAuthStore();
  const { conversations, loading } = useRecentConversations(user?.id || '');
  const [minimized, setMinimized] = useState(false);
  const [chatUser, setChatUser] = useState<{id: string, name?: string, avatar?: string} | null>(null);

  // Detectar si es móvil para bottom sheet, escritorio centrado
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <BottomSheetModal
      open={open}
      onClose={onClose}
      title={undefined}
      height={isMobile ? '80vh' : '70vh'}
      desktopMode={!isMobile}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 p-4 border-b bg-white rounded-t-xl">
          <img src={user?.avatar || '/default-avatar.png'} alt={user?.displayName || user?.username} className="w-10 h-10 rounded-full" />
          <div className="font-semibold text-sm text-blue-600">@{user?.username}</div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ConversationsList
            onSelectUser={(id, name, avatar) => setChatUser({id, name, avatar})}
          />
        </div>
        <ChatUserModal
          open={!!chatUser}
          onClose={() => setChatUser(null)}
          userId={chatUser?.id || ''}
          userName={chatUser?.name}
          userAvatar={chatUser?.avatar}
        />
      </div>
    </BottomSheetModal>
  );
};

export default ConversationModal;
