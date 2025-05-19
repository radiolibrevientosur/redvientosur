import React, { useState } from 'react';
import { Image, Video, FileAudio, FileText, Mic, Send } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { PostType, usePostStore } from '../../store/postStore';
import { toast } from 'sonner';

interface CreatePostFormProps {
  onSuccess?: () => void;
}

const CreatePostForm: React.FC<CreatePostFormProps> = ({ onSuccess }) => {
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [postType, setPostType] = useState<PostType>('text');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuthStore();
  const { addPost } = usePostStore();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to create a post');
      return;
    }
    
    if (!content.trim() && !mediaUrl) {
      toast.error('Please add some content to your post');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await addPost({
        userId: user.id,
        type: postType,
        content: content.trim(),
        mediaUrl: mediaUrl || undefined
      });
      
      // Reset form
      setContent('');
      setMediaUrl('');
      setPostType('text');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleMediaTypeChange = (type: PostType) => {
    setPostType(type);
    
    // In a real app, here we'd show a media picker UI
    // For demo purposes, we'll use placeholder images based on type
    if (type === 'image') {
      setMediaUrl('https://images.pexels.com/photos/3617457/pexels-photo-3617457.jpeg?auto=compress&cs=tinysrgb&w=600');
    } else if (type === 'video') {
      setMediaUrl('https://images.pexels.com/photos/3759099/pexels-photo-3759099.jpeg?auto=compress&cs=tinysrgb&w=600');
    } else if (type === 'audio') {
      setMediaUrl('');
    } else if (type === 'document') {
      setMediaUrl('');
    } else {
      setMediaUrl('');
    }
  };
  
  return (
    <div className="feed-item mb-4">
      <form onSubmit={handleSubmit}>
        <div className="p-4">
          <div className="flex items-start space-x-3">
            <div className="avatar">
              <img 
                src={user?.avatar} 
                alt={user?.displayName} 
                className="avatar-img"
              />
            </div>
            <div className="flex-1">
              <textarea
                placeholder="What's happening?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-2 text-gray-900 dark:text-white bg-transparent border-none focus:ring-0 resize-none"
                rows={3}
              />
              
              {mediaUrl && postType === 'image' && (
                <div className="mt-2 relative rounded-lg overflow-hidden">
                  <img 
                    src={mediaUrl} 
                    alt="Post preview" 
                    className="w-full h-auto max-h-[300px] object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setMediaUrl('')}
                    className="absolute top-2 right-2 bg-gray-900/70 text-white p-1 rounded-full"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center space-x-4">
            <button 
              type="button" 
              onClick={() => handleMediaTypeChange('image')}
              className={`p-2 rounded-full ${postType === 'image' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
            >
              <Image className="h-5 w-5" />
            </button>
            <button 
              type="button" 
              onClick={() => handleMediaTypeChange('video')}
              className={`p-2 rounded-full ${postType === 'video' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
            >
              <Video className="h-5 w-5" />
            </button>
            <button 
              type="button" 
              onClick={() => handleMediaTypeChange('audio')}
              className={`p-2 rounded-full ${postType === 'audio' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
            >
              <FileAudio className="h-5 w-5" />
            </button>
            <button 
              type="button" 
              onClick={() => handleMediaTypeChange('document')}
              className={`p-2 rounded-full ${postType === 'document' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
            >
              <FileText className="h-5 w-5" />
            </button>
            <button 
              type="button" 
              onClick={() => toast.info('Voice recording feature coming soon!')}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <Mic className="h-5 w-5" />
            </button>
          </div>
          
          <button 
            type="submit"
            disabled={isSubmitting || (!content.trim() && !mediaUrl)}
            className="btn btn-primary py-1.5 px-4 rounded-full disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Post
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePostForm;