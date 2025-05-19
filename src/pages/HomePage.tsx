import React, { useEffect } from 'react';
import CreatePostForm from '../components/posts/CreatePostForm';
import PostCard from '../components/posts/PostCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { usePostStore } from '../store/postStore';

const HomePage = () => {
  const { posts, isLoading, fetchPosts } = usePostStore();
  
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);
  
  return (
    <div className="space-y-4">
      <CreatePostForm />
      
      {isLoading ? (
        <div className="py-8 flex justify-center">
          <LoadingSpinner message="Loading posts..." />
        </div>
      ) : posts.length === 0 ? (
        <div className="card py-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">No posts yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create your first post to get started!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;