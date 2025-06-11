import React from 'react';
import './PostCard.css';
import { Card, Avatar, Button } from 'antd';
import { UserOutlined } from '@ant-design/icons';

const PostCard = ({ post, authorObj, onEdit, onDelete, formatTime, getStatusTag }) => {
  const username = authorObj?.username || 'Unknown';
  const createdAt = post.createdAt ? formatTime(new Date(post.createdAt)) : '';
  return (
    <Card key={post._id} className="post-card">
      <Card.Meta
        avatar={<Avatar src={authorObj?.avatar} icon={<UserOutlined />} />}
        title={username}
        description={createdAt}
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
        <Button size="small" onClick={() => onEdit(post)}>Edit</Button>
        <Button size="small" danger onClick={() => onDelete(post._id)}>Delete</Button>
      </div>
    </Card>
  );
};

export default PostCard;
