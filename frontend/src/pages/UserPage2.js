import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { getMessages, sendMessage as sendChatMessage, updateMessage, deleteMessage, reactToMessage } from '../api/chatApi';
import { createPost, fetchMyPosts } from '../api/postApi';
import './UserPage.css';
import { Card, Avatar, Button, Spin, Typography, message, Tag } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { getCurrentUser, searchUsers, getUser, getUserFriends } from '../api/userApi';
import { logout } from '../api/authApi';
import { useNavigate } from 'react-router-dom';
import { sendFriendRequest, getPendingFriendships, acceptFriendRequest, rejectFriendRequest } from '../api/friendshipApi';
import Navbar from '../components/Navbar';

const { Title, Paragraph, Text } = Typography;

const CHAT_SERVICE_URL = 'http://localhost:5000';
const CHAT_NAMESPACE = '/api/messages';

const UserPage = () => {
  // --- Notification state ---
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  // --- Post states ---
  const [postContent, setPostContent] = useState('');
  const [postMedia, setPostMedia] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [loadingMyPosts, setLoadingMyPosts] = useState(false);

  // User state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch my posts
  const fetchMyPostsHandler = async () => {
    if (!user?._id) return;
    setLoadingMyPosts(true);
    try {
      const res = await fetchMyPosts(user._id);
      setMyPosts(res.data);
    } catch {
      setMyPosts([]);
    } finally {
      setLoadingMyPosts(false);
    }
  };

  useEffect(() => {
    if (user?._id) fetchMyPostsHandler();
    // eslint-disable-next-line
  }, [user?._id]);

  // Friends state
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  // Friend requests state
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Search state
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);

  // Chat states
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [reactingMsgId, setReactingMsgId] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Refs
  const socketRef = useRef(null);
  const chatBoxRef = useRef(null);
  const navigate = useNavigate();

  // Helper function to get user's reaction to a message
  const myReaction = (msg) => {
    return msg.reactions?.find(r => r.userId === user?._id);
  };

  // Fetch current user info
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getCurrentUser();
        setUser(res.data);
      } catch (err) {
        message.error('Failed to load user info. Please login again.');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  // Fetch pending friend requests
  useEffect(() => {
    const fetchRequests = async () => {
      setLoadingRequests(true);
      try {
        const res = await getPendingFriendships();
        let requests = res.data;
        
        // Find requests missing requesterUser
        const missing = requests.filter(r => !r.requesterUser && r.requester);
        if (missing.length > 0) {
          // Fetch all missing users in parallel
          const userLookups = await Promise.all(
            missing.map(r =>
              getUser(r.requester)
                .then(res => ({ _id: r._id, user: res.data }))
                .catch(() => null)
            )
          );
          // Merge user info into requests
          requests = requests.map(r => {
            if (!r.requesterUser && r.requester) {
              const found = userLookups.find(u => u && u._id === r._id);
              if (found) {
                return { ...r, requesterUser: found.user };
              }
            }
            return r;
          });
        }
        setPendingRequests(requests);
      } catch (err) {
        setPendingRequests([]);
      } finally {
        setLoadingRequests(false);
      }
    };
    fetchRequests();
  }, []);

  // Fetch friends when user is loaded
  useEffect(() => {
    if (!user) return;
    setLoadingFriends(true);
    getUserFriends(user._id)
      .then(res => setFriends(res.data))
      .catch(() => setFriends([]))
      .finally(() => setLoadingFriends(false));
  }, [user]);

  // Fetch chat history when friend selected
  useEffect(() => {
    if (!user || !selectedFriend) return;
    setChatLoading(true);
    getMessages(selectedFriend._id)
      .then(res => setChatMessages(res.data))
      .catch(() => setChatMessages([]))
      .finally(() => setChatLoading(false));
  }, [selectedFriend, user]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // --- Notification Socket.IO listeners ---
  useEffect(() => {
    if (!user) return;
    // Connect socket for notifications (reuse chat socket or create new one)
    const socket = io(CHAT_SERVICE_URL + CHAT_NAMESPACE, {
      path: '/api/messages/socket.io/',
      auth: { token: localStorage.getItem('jwt') },
      transports: ['websocket']
    });
    socket.emit('join', user._id);
    // Listen for new message from friend
    socket.on('private_message', msg => {
      // Always show notification in the bell, even if chat is open
      if (msg.senderId !== user._id) {
        setNotifications(prev => [
          {
            type: 'message',
            from: msg.senderUsername || msg.senderId,
            content: `${msg.senderUsername || msg.senderId} sent you a message`,
            timestamp: new Date(),
            read: false
          },
          ...prev
        ]);
      }
    });
    // Listen for new post from friend
    socket.on('friend_post', post => {
      setNotifications(prev => [
        { type: 'post', from: post.username || post.userId, content: post.content, timestamp: new Date(), read: false },
        ...prev
      ]);
    });
    return () => { socket.disconnect(); };
  }, [user]);

  // Handle friend request actions
  const handleAcceptRequest = async (requesterId, requestId) => {
    try {
      await acceptFriendRequest(requesterId);
      message.success('Friend request accepted');
      setPendingRequests(prev => prev.filter(r => r._id !== requestId));
    } catch (err) {
      message.error('Failed to accept request');
    }
  };

  const handleRejectRequest = async (requesterId, requestId) => {
    try {
      await rejectFriendRequest(requesterId);
      message.success('Friend request rejected');
      setPendingRequests(prev => prev.filter(r => r._id !== requestId));
    } catch (err) {
      message.error('Failed to reject request');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem('jwt');
      message.success('Logged out successfully!');
      navigate('/login');
    } catch (err) {
      message.error('Logout failed');
    }
  };

  // Handle user search
  const handleSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    try {
      const res = await searchUsers(search.trim());
      // Exclude current user from results
      setResults(res.data.filter(u => u.username !== user.username));
    } catch (err) {
      message.error("Failed to search users");
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Chat message handlers
  const handleUpdateMessage = async (msgId) => {
    try {
      await updateMessage(msgId, editContent);
      setChatMessages(prev => prev.map(m => m._id === msgId ? { ...m, content: editContent } : m));
      setEditingMsgId(null);
      setEditContent('');
    } catch {
      message.error('Failed to update message');
    }
  };

  const handleDeleteMessage = async (msgId) => {
    try {
      await deleteMessage(msgId);
      setChatMessages(prev => prev.filter(m => m._id !== msgId));
    } catch {
      message.error('Failed to delete message');
    }
  };

  const handleReactToMessage = async (msgId, emoji) => {
    console.log('[ReactToMessage] Attempting to react:', { msgId, emoji });
    try {
      await reactToMessage(msgId, emoji);
      setChatMessages(prev => prev.map(m => 
        m._id === msgId 
          ? { 
              ...m, 
              reactions: [
                ...(m.reactions?.filter(r => r.userId !== user._id) || []), 
                { userId: user._id, emoji }
              ] 
            } 
          : m
      ));
      setReactingMsgId(null);
    } catch (err) {
      if (err?.response?.status === 404 && err?.response?.data?.message === 'Message not found') {
        message.error('This message no longer exists or was deleted.');
      } else {
        message.error('Failed to react');
      }
      console.error('[ReactToMessage] Error:', err);
    }
  };

  const handleSendMessage = () => {
    if (!chatInput.trim() || !selectedFriend) return;
    const msg = { senderId: user._id, receiverId: selectedFriend._id, content: chatInput };
    
    // Emit via Socket.IO
    if (socketRef.current) {
      socketRef.current = io('http://localhost:5000/api/messages', {
        auth: { token: localStorage.getItem('jwt') },
        transports: ['websocket']
      });
      socketRef.current.emit('join', user._id);
      socketRef.current.emit('private_message', msg);
    }
    
    // Persist via REST
    sendChatMessage({ receiverId: selectedFriend._id, content: chatInput });
    setChatInput('');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <Navbar isAdmin={user.role === 'admin'} onLogout={handleLogout} username={user.username} />

      {/* Notifications Section */}
      <div style={{ position: 'relative', margin: '16px 0' }}>
        <Button shape="circle" icon={<span role="img" aria-label="bell">🔔</span>} onClick={() => setShowNotifications(s => !s)}>
          {notifications.some(n => !n.read) && <span style={{ color: 'red', marginLeft: 4 }}>●</span>}
        </Button>
        {showNotifications && (
          <Card title="Notifications" style={{ position: 'absolute', zIndex: 10, width: 320, left: 40 }}>
            {notifications.length === 0 ? (
              <Text type="secondary">No notifications</Text>
            ) : (
              notifications.slice(0, 10).map((n, idx) => (
                <div key={idx} style={{ marginBottom: 8, background: n.read ? '#fff' : '#e6f7ff', padding: 8, borderRadius: 4 }}>
                  <b>{n.type === 'message' ? 'New Message' : 'Friend Post'}</b> from <span style={{ color: '#1890ff' }}>{n.from}</span>:<br />
                  <span>{n.content}</span>
                  <div style={{ fontSize: 12, color: '#aaa' }}>{n.timestamp.toLocaleString ? n.timestamp.toLocaleString() : n.timestamp+''}</div>
                </div>
              ))
            )}
            <Button size="small" onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))} style={{ marginTop: 8 }}>
              Mark all as read
            </Button>
          </Card>
        )}
      </div>

      <div className="user-main">
        {/* Profile Card */}
        <div className="profile-card">

        {/* Post Publishing Section */}
        <div className="post-section">
          <Title level={4}>Create a Post</Title>
          <form
            className="post-form"
            onSubmit={async e => {
              e.preventDefault();
              if (!postContent.trim() && postMedia.length === 0) return;
              try {
                let mediaUrls = [];
                if (postMedia.length > 0) {
                  // Simulate upload, in real app upload to S3 or server
                  const formData = new FormData();
Array.from(postMedia).forEach(file => formData.append('media', file));
// Upload to backend and get URLs
const uploadRes = await fetch(`${process.env.REACT_APP_GATEWAY_BASE_URL || 'http://localhost:5000/api'}/posts/upload`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${localStorage.getItem('jwt')}` },
  body: formData
});
if (!uploadRes.ok) throw new Error('Upload failed');
const uploadData = await uploadRes.json();
mediaUrls = uploadData.urls || [];
                }
                await createPost({ content: postContent, media: mediaUrls });
                setPostContent('');
                setPostMedia([]);
                message.success('Post submitted for review!');
                fetchMyPostsHandler();
              } catch (err) {
                message.error('Failed to create post');
              }
            }}
          >
            <textarea
              className="post-input"
              value={postContent}
              onChange={e => setPostContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={3}
            />
            <input
              type="file"
              className="post-media-input"
              multiple
              accept="image/*,video/*"
              onChange={e => setPostMedia(e.target.files)}
            />
            <Button type="primary" htmlType="submit" className="post-submit-btn" disabled={!postContent.trim() && (!postMedia || postMedia.length === 0)}>
              Publish
            </Button>
          </form>
          <div className="my-posts-list">
            <Title level={5}>My Posts</Title>
            {loadingMyPosts ? (
              <Spin />
            ) : myPosts.length > 0 ? (
              myPosts.map(post => (
                <Card key={post._id} className="my-post-card">
                  <div className="my-post-content">{post.content}</div>
                  {post.media && post.media.length > 0 && (
                    <div className="my-post-media">
                      {post.media.map((url, idx) => (
                        <img key={idx} src={url} alt="media" className="my-post-media-img" />
                      ))}
                    </div>
                  )}
                  <div className="my-post-meta">
                    <Tag color={post.status === 'approved' ? 'green' : post.status === 'pending' ? 'orange' : 'red'}>
                      {post.status}
                    </Tag>
                  </div>
                </Card>
              ))
            ) : (
              <Text type="secondary">No posts yet.</Text>
            )}
          </div>
        </div>

          <Avatar size={90} src={user.avatar} icon={<UserOutlined />} className="profile-avatar" />
          <div className="profile-info">
            <Title level={3} className="profile-title">{user.username}</Title>
            <Text type="secondary">{user.email}</Text>
            <div className="profile-tags">
              <Tag color={user.isApproved ? 'green' : 'orange'}>
                {user.isApproved ? 'Approved' : 'Pending Approval'}
              </Tag>
              <Tag color={user.role === 'admin' ? 'red' : 'blue'}>
                {user.role}
              </Tag>
            </div>
          </div>
          <Paragraph className="profile-bio">
            <b>Bio:</b> {user.bio || <Text type="secondary">No bio provided.</Text>}
          </Paragraph>
        </div>

        {/* Pending Friend Requests Section */}
        <Card title="Pending Friend Requests" style={{ marginBottom: 24 }}>
          {loadingRequests ? (
            <Spin />
          ) : pendingRequests.length === 0 ? (
            <Text type="secondary">No pending friend requests.</Text>
          ) : (
            pendingRequests.map(req => {
              const userInfo = req.requesterUser || req.requester || {};
              return (
                <div key={req._id} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <Avatar icon={<UserOutlined />} src={userInfo.avatar} style={{ marginRight: 8 }} />
                  <span style={{ flex: 1 }}>{userInfo.username || userInfo.email || 'Unknown User'}</span>
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => handleAcceptRequest(userInfo._id, req._id)}
                    style={{ marginRight: 8 }}
                  >
                    Accept
                  </Button>
                  <Button
                    danger
                    size="small"
                    onClick={() => handleRejectRequest(userInfo._id, req._id)}
                  >
                    Reject
                  </Button>
                </div>
              );
            })
          )}
        </Card>

        {/* Friends Section */}
        <div className="friends-section">
          <Title level={4}>Your Friends</Title>
          {loadingFriends ? (
            <Spin />
          ) : friends.length > 0 ? (
            <div className="friends-list">
              {friends.map(friend => (
                <Card 
                  key={friend._id} 
                  className={`friend-card${selectedFriend && selectedFriend._id === friend._id ? ' friend-card-selected' : ''}`}
                  onClick={() => setSelectedFriend(friend)}
                >
                  <Card.Meta
                    avatar={<Avatar src={friend.avatar && !friend.avatar.startsWith('blob:') ? friend.avatar : undefined} icon={<UserOutlined />} />}
                    title={friend.username}
                    description={friend.email}
                  />
                </Card>
              ))}
            </div>
          ) : (
            <Text type="secondary">You have no friends yet.</Text>
          )}
        </div>

        {/* Chat Section */}
        {selectedFriend && (
          <div className="chat-section">
            <Title level={5}>Chat with {selectedFriend.username}</Title>
            <div ref={chatBoxRef} className="chat-box">
              {chatLoading ? (
                <Spin />
              ) : chatMessages.length > 0 ? (
                chatMessages.map((msg, idx) => {
                  const isSender = msg.senderId === user._id;
                  return (
                    <div key={msg._id || idx} className="chat-message">
                      <div className={`chat-bubble ${isSender ? 'chat-bubble-sender' : 'chat-bubble-receiver'}`}>
                        {editingMsgId === msg._id ? (
                          <div className="chat-edit-container">
                            <input
                              className="chat-edit-input"
                              value={editContent}
                              onChange={e => setEditContent(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleUpdateMessage(msg._id);
                                if (e.key === 'Escape') {
                                  setEditingMsgId(null);
                                  setEditContent('');
                                }
                              }}
                            />
                            <div className="chat-edit-actions">
                              <Button size="small" type="primary" onClick={() => handleUpdateMessage(msg._id)}>
                                Save
                              </Button>
                              <Button size="small" onClick={() => {
                                setEditingMsgId(null);
                                setEditContent('');
                              }}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <span className="chat-message-content">{msg.content}</span>
                            {msg.reactions && msg.reactions.length > 0 && (
                              <div className="chat-reactions">
                                {msg.reactions.map((reaction, i) => (
                                  <span key={i} className="chat-reaction">
                                    {reaction.emoji}
                                  </span>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <div className="chat-message-actions">
                        {(msg.senderId === user._id) && (
                          <>
                            <Button 
                              size="small" 
                              className="chat-action-btn" 
                              onClick={() => { 
                                setEditingMsgId(msg._id); 
                                setEditContent(msg.content); 
                              }}
                            >
                              Edit
                            </Button>
                            <Button 
                              size="small" 
                              danger 
                              className="chat-action-btn" 
                              onClick={() => handleDeleteMessage(msg._id)}
                            >
                              Delete
                            </Button>
                          </>
                        )}
                        <Button 
                          size="small" 
                          className="chat-action-btn" 
                          onClick={() => setReactingMsgId(msg._id)}
                        >
                          {myReaction(msg) ? 'Change Reaction' : 'React'}
                        </Button>
                      </div>
                      {reactingMsgId === msg._id && msg._id && (
                        <div className="chat-emoji-picker">
                          {["😀","😂","😍","👍","🎉","😢","😡","❤️"].map(e => (
                            <span
                              key={e}
                              className="chat-emoji"
                              onClick={() => { handleReactToMessage(msg._id, e); }}
                            >
                              {e}
                            </span>
                          ))}
                          <Button 
                            size="small" 
                            className="chat-action-btn" 
                            onClick={() => setReactingMsgId(null)}
                          >
                            Close
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <Text type="secondary">No messages yet.</Text>
              )}
            </div>
            <div className="chat-input-row">
              <input
                className="chat-input-box"
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
                placeholder="Type your message..."
              />
              <Button 
                type="primary" 
                className="chat-send-btn" 
                onClick={handleSendMessage} 
                disabled={!chatInput.trim()}
              >
                Send
              </Button>
            </div>
          </div>
        )}

        {/* User Search Section */}
        <div className="user-search-section">
          <Title level={4}>Search for Other Users</Title>
          <div className="user-search-row">
            <input
              className="user-search-input"
              type="text"
              placeholder="Enter username..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
            />
            <Button 
              type="primary" 
              className="user-search-btn" 
              onClick={handleSearch} 
              loading={searching}
            >
              Search
            </Button>
          </div>
          {searching && <Spin />}
          {!searching && results.length > 0 && (
            <div className="search-results">
              {results.map(u => (
                <Card key={u._id || u.username} className="search-result-card">
                  <Card.Meta
                    avatar={<Avatar src={u.avatar && !u.avatar.startsWith('blob:') ? u.avatar : undefined} icon={<UserOutlined />} />}
                    title={u.username}
                  />
                  <Button
                    type="primary"
                    className="send-request-btn"
                    onClick={async () => {
                      try {
                        await sendFriendRequest(u._id);
                        message.success(`Friend request sent to ${u.username}`);
                      } catch (err) {
                        message.error(
                          err?.response?.data?.message || `Failed to send request to ${u.username}`
                        );
                      }
                    }}
                  >
                    Send Request
                  </Button>
                </Card>
              ))}
            </div>
          )}
          {!searching && search && results.length === 0 && (
            <Text type="secondary">No users found.</Text>
          )}
        </div>
      </div>
    </>
  );
};

export default UserPage;