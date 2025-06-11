import React, { useState } from 'react';
import './PostCard.css';
import { Card, Avatar, Button, Input, Space, List } from 'antd';
import { UserOutlined, LikeOutlined, CommentOutlined } from '@ant-design/icons';
import { likePost, commentOnPost, updatePostLikes } from '../api/postApi';
import { message } from 'antd';
import { resolveAvatarUrl } from '../utils/helpers';

const PostCard = ({ post, authorObj, onEdit, onDelete, formatTime, getStatusTag, isOwner, onLike, status }) => {
  // Debug logs
  console.log('PostCard props:', { post, authorObj, status });

  // Use userId as username if authorObj is undefined
  const username = authorObj?.username || post.userId || 'Unknown';
  const avatar = authorObj?.avatar || undefined;

  // Ensure we have proper status
  const postStatus = status || post.status || 'Unknown Status';
  const [likes, setLikes] = useState(() => {
    console.log('Initializing likes:', post.likes);
    return Array.isArray(post.likes) ? post.likes : [];
  });
  const [comments, setComments] = useState(post.comments || []);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);

  // Like handler - will be implemented when backend is ready
  const handleLike = async () => {
    message.info('Like functionality will be available soon!');
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    try {
      const comment = await commentOnPost(post._id, commentText);
      setComments([...comments, comment]);
      setCommentText('');
      setShowComments(true);
    } catch (err) {
      message.error('Failed to post comment');
    }
  };

  const createdAt = post.createdAt ? formatTime(new Date(post.createdAt)) : '';
  return (
    <Card key={post._id} className="post-card">
      <Card.Meta
        avatar={<Avatar src={avatar ? resolveAvatarUrl(avatar) : undefined} icon={<UserOutlined />} />}
        title={username}
        description={getStatusTag(postStatus)}
      />
      <div className="post-content">{post.content}</div>
      {post.media && post.media.length > 0 && (
        <div className="post-media">
          {post.media.map((url, idx) => {
            const isBlobUrl = url.startsWith('blob:');
            let displayUrl = url;
            if (url.startsWith('http://localhost:5003/uploads/')) {
              const filename = url.split('/uploads/')[1];
              displayUrl = `${process.env.REACT_APP_GATEWAY_BASE_URL || 'http://localhost:5000/api'}/media/uploads/${filename}`;
            }
            if (isBlobUrl) {
              return (
                <div
                  key={idx}
                  className="post-media-item post-media-item-broken"
                >
                  <span role="img" aria-label="broken">🚫</span>
                </div>
              );
            }
            return displayUrl.match(/\.(mp4|webm|ogg)$/i)
              ? (
                <video key={idx} src={displayUrl} controls className="post-media-item post-media-item-cover" />
              ) : (
                <img key={idx} src={displayUrl} alt="post media" className="post-media-item" />
              );
          })}
        </div>
      )}
      <div className="post-actions post-actions-row">
        <Button
          size="small"
          icon={<LikeOutlined />}
          type={likes.includes(localStorage.getItem('userId')) ? 'primary' : 'default'}
          onClick={handleLike}
        >
          {likes.length}
        </Button>
        <Button
          size="small"
          icon={<CommentOutlined />}
          onClick={() => setShowComments(!showComments)}
        >
          {comments.length}
        </Button>
        {isOwner && (
          <>
            <Button size="small" onClick={() => onEdit(post)}>Edit</Button>
            <Button size="small" danger onClick={() => onDelete(post._id)}>Delete</Button>
          </>
        )}
      </div>
      {showComments && (
        <div className="post-comments">
          <Input.TextArea
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder="Write a comment..."
            autoSize={{ minRows: 1, maxRows: 3 }}
            onPressEnter={handleComment}
          />
          <Button
            type="primary"
            size="small"
            onClick={handleComment}
            disabled={!commentText.trim()}
            style={{ marginTop: 8 }}
          >
            Comment
          </Button>
          <List
            className="comment-list"
            header={`${comments.length} ${comments.length === 1 ? 'comment' : 'comments'}`}
            itemLayout="horizontal"
            dataSource={comments}
            renderItem={(item) => (
              <List.Item>
                <div className="comment-item">
                  <Avatar 
                    src={item?.author?.avatar ? resolveAvatarUrl(item.author.avatar) : undefined} 
                    icon={<UserOutlined />} 
                    size="small"
                  />
                  <div className="comment-content">
                    <div className="comment-author">{item?.author?.username || item?.author?.name || 'Unknown'}</div>
                    <div className="comment-text">{item.content}</div>
                    <div className="comment-time">
                      {formatTime(new Date(item.createdAt))}
                    </div>
                  </div>
                </div>
              </List.Item>
            )}
          />
        </div>
      )}
    </Card>
  );
};

export default PostCard;
