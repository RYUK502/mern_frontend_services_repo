import React, { useState, useEffect } from 'react';
import { Card, Avatar, Button, Spin, Typography, message, Tag } from 'antd';
import { 
  UserOutlined, 
  CameraOutlined 
} from '@ant-design/icons';
import PostCard from './PostCard';
import { createPost, fetchApprovedPosts, updatePost, deletePost } from '../api/postApi';
import { getUser } from '../api/userApi';
import { formatTime, getStatusTag } from '../utils/helpers';

const { Text } = Typography;

const Accueil = ({ user }) => {
  // Helper functions
  const resolveAvatarUrl = (avatar) => {
    if (!avatar) return undefined;
    if (avatar.startsWith('http')) return avatar;
    // Adjust as needed for your gateway or backend port
    const base = process.env.REACT_APP_GATEWAY_BASE_URL || 'http://localhost:5000/api';
    if (avatar.startsWith('/uploads/')) {
      return `${base}/media${avatar}`;
    }
    return avatar;
  };

  const [postContent, setPostContent] = useState('');
  const [postMedia, setPostMedia] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [loadingMyPosts, setLoadingMyPosts] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editMedia, setEditMedia] = useState([]);
  const [editUploading, setEditUploading] = useState(false);

  // Fetch all approved posts
  const fetchAllPosts = async () => {
    setLoadingMyPosts(true);
    try {
      const res = await fetchApprovedPosts();
      console.log('Raw posts from API:', res.data);
      console.log('First post structure:', JSON.stringify(res.data[0], null, 2));
      
      // First get all unique userIds (both post authors and comment authors)
      const userIds = [...new Set(
        [...res.data.map(post => post.userId)] // Post authors
        .concat(...res.data.flatMap(post => post.comments?.map(comment => comment.userId) || [])) // Comment authors
      )];
      console.log('User IDs to fetch:', userIds);
      
      // Fetch all users data in one go
      const usersPromise = userIds.map(userId => getUser(userId));
      const usersData = await Promise.all(usersPromise);
      const usersMap = usersData.reduce((acc, user, index) => {
        acc[userIds[index]] = user.data;
        return acc;
      }, {});
      console.log('Users data:', usersMap);
      
      // Map posts with full author data and comments
      const postsWithAuthors = res.data.map(post => ({
        ...post,
        author: {
          _id: post.userId,
          username: usersMap[post.userId]?.username || post.userId,
          name: usersMap[post.userId]?.name,
          avatar: usersMap[post.userId]?.avatar
        },
        likes: post.likes || [],
        comments: post.comments?.map(comment => ({
          ...comment,
          author: {
            _id: comment.userId,
            username: usersMap[comment.userId]?.username || comment.userId,
            name: usersMap[comment.userId]?.name,
            avatar: usersMap[comment.userId]?.avatar
          }
        })) || []
      }));
      
      // Filter posts to show only current user's posts
      const userPosts = postsWithAuthors.filter(post => post.userId === user?._id);
      
      console.log('User posts:', userPosts);
      setMyPosts(userPosts);
    } catch (error) {
      console.error('Fetch posts error:', error);
      message.error('Failed to fetch posts');
      setMyPosts([]);
    } finally {
      setLoadingMyPosts(false);
    }
  };

  // Format time helper
  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getStatusTag = (status) => {
    let color = 'default';
    let text = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
    switch (status) {
      case 'pending':
        color = 'gold';
        break;
      case 'approved':
        color = 'green';
        break;
      case 'rejected':
        color = 'red';
        break;
    }
    return <Tag color={color}>{text}</Tag>;
  };

  // Handle Create Post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postContent.trim() && postMedia.length === 0) return;
    try {
      let mediaUrls = [];
      // If there are files, upload them to backend and get URLs
      if (postMedia.length > 0) {
        const formData = new FormData();
        Array.from(postMedia).forEach(file => formData.append('media', file));
        try {
          const uploadRes = await fetch(`${process.env.REACT_APP_GATEWAY_BASE_URL || 'http://localhost:5000/api'}/media/upload`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${localStorage.getItem('jwt')}` },
            body: formData
          });
          if (!uploadRes.ok) throw new Error('Upload failed');
          const uploadData = await uploadRes.json();
          mediaUrls = uploadData.urls || [];
        } catch (err) {
          message.error('Media upload failed. Only text will be posted.');
          mediaUrls = [];
        }
      }
      // Now create the post in backend
      await createPost({ content: postContent, media: mediaUrls });
      setPostContent('');
      setPostMedia([]);
      message.success('Post created successfully!');
      fetchAllPosts();
    } catch (err) {
      message.error('Failed to create post');
    }
  };

  // Handle Delete Post
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await deletePost(postId);
      message.success('Post deleted');
      fetchAllPosts();
    } catch (err) {
      message.error('Failed to delete post');
    }
  };

  // Handle Post Refresh
  const refreshPosts = () => {
    fetchAllPosts();
  };

  // Handle Edit Post
  const handleEditPost = (post) => {
    setEditingPost(post);
    setEditContent(post.content);
    setEditMedia(post.media || []);
  };

  // Handle Save Edit
  const handleSaveEdit = async () => {
    if (!editingPost) return;
    setEditUploading(true);
    try {
      let mediaUrls = editingPost.media || [];
      // If new files are selected, upload them
      if (editMedia && editMedia.length > 0 && editMedia[0] instanceof File) {
        const formData = new FormData();
        Array.from(editMedia).forEach(file => formData.append('media', file));
        const uploadRes = await fetch(`${process.env.REACT_APP_GATEWAY_BASE_URL || 'http://localhost:5000/api'}/media/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('jwt')}` },
          body: formData
        });
        if (!uploadRes.ok) throw new Error('Upload failed');
        const uploadData = await uploadRes.json();
        mediaUrls = uploadData.urls || [];
      }
      await updatePost(editingPost._id, { content: editContent, media: mediaUrls });
      message.success('Post updated');
      setEditingPost(null);
      setEditContent('');
      setEditMedia([]);
      fetchAllPosts();
    } catch (err) {
      message.error('Failed to update post');
    } finally {
      setEditUploading(false);
    }
  };

  // Fetch posts on mount
  useEffect(() => {
    if (user?._id) {
      fetchAllPosts();
    }
  }, [user?._id]);

  return (
    <>
      {/* Post Creation */}
      <div className="post-creation">
        <div className="post-creation-header">
          <Avatar 
            src={resolveAvatarUrl(user?.avatar)} 
            icon={<UserOutlined />} 
            size={40}
            className="post-creation-avatar"
          />
          <Text strong>What's on your mind, {user?.username}?</Text>
        </div>
        <div className="post-form" onSubmit={handleCreatePost}>
          <textarea
            className="post-input"
            value={postContent}
            onChange={e => setPostContent(e.target.value)}
            placeholder="Share your thoughts..."
          />
          <div className="post-actions">
            <input
              type="file"
              className="post-media-input"
              multiple
              accept="image/*,video/*"
              onChange={e => setPostMedia(Array.from(e.target.files))}
              style={{ display: 'none' }}
              id="media-upload"
            />
            <label htmlFor="media-upload" className="post-media-input">
              <CameraOutlined /> Add Photos/Videos
            </label>
            <Button 
              type="primary" 
              onClick={handleCreatePost}
              className="post-submit-btn"
              disabled={!postContent.trim() && (!postMedia || postMedia.length === 0)}
            >
              Post
            </Button>
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="posts-feed">
        {loadingMyPosts ? (
          <div className="flex-center" style={{ padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : myPosts.length === 0 ? (
          <div className="flex-center" style={{ padding: 40 }}>
            <Text>No posts yet. Be the first to post something!</Text>
          </div>
        ) : (
          myPosts.map(post => (
            <PostCard
              key={post._id}
              post={post}
              authorObj={post.author}
              status={post.status}
              formatTime={formatTime}
              getStatusTag={getStatusTag}
              isOwner={user?._id === post.userId}
              onEdit={handleEditPost}
              onDelete={handleDeletePost}
              onLike={fetchAllPosts}
            />
          ))
        )}
      </div>
    </>
  );
};

export default Accueil;
