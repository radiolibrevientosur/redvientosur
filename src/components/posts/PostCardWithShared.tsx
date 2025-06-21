import React from 'react';
import { Post } from '../../store/postStore';
import { MediaItem } from './subcomponents/MediaCarousel';
import { LinkData } from './subcomponents/LinkPreview';
import { PollData } from './subcomponents/Poll';
import CommentThread, { CommentData } from '../shared/CommentThread';
import ReactionsBar, { ReactionData } from '../shared/ReactionsBar';

interface PostCardWithSharedProps {
  post: Post;
  user: { nombre: string; avatar: string; verificado?: boolean; id?: string };
  media?: MediaItem[];
  text: string;
  backgroundColor?: string;
  linkData?: LinkData;
  pollData?: PollData;
  onVote?: (optionId: string) => void;
}

const PostCardWithShared: React.FC<PostCardWithSharedProps> = ({ post, user, media, text, backgroundColor, linkData, pollData, onVote }) => {
  // Adaptar los datos de comentarios y reacciones al formato de los componentes compartidos
  const comments: CommentData[] = post.comments.map(c => ({
    id: c.id,
    userId: c.userId,
    userName: user.nombre,
    userAvatar: user.avatar,
    content: c.content,
    createdAt: c.createdAt,
    replies: [], // TODO: mapear respuestas anidadas si existen
    canEdit: true, // TODO: lógica real
    canDelete: true // TODO: lógica real
  }));
  const reactions: ReactionData[] = [
    { emoji: '❤️', count: post.likes.length, reacted: false },
    // TODO: mapear otros tipos de reacciones
  ];

  return (
    <article className="feed-item w-full border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-none rounded-none">
      {/* ...header, media, etc. igual que en PostCard... */}
      <div className="px-4 pb-3 pt-2" style={backgroundColor ? { backgroundColor } : {}}>
        <span>{text}</span>
      </div>
      <div className="flex items-center space-x-4 py-2 px-4 justify-between">
        <ReactionsBar reactions={reactions} onReact={() => {}} />
      </div>
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl border-t border-gray-200 dark:border-gray-700 transition-all duration-300">
        <CommentThread comments={comments} />
      </div>
    </article>
  );
};

export default PostCardWithShared;
