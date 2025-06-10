import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { getMessages, sendMessage as sendChatMessage, updateMessage, deleteMessage, reactToMessage } from '../api/chatApi';
import { createPost, fetchMyPosts, updatePost, deletePost } from '../api/postApi';
import './UserPage.css';
import { Card, Avatar, Button, Spin, Typography, message, Tag } from 'antd';
import { 
  LogoutOutlined, 
  UserOutlined, 
  HomeOutlined, 
  MessageOutlined, 
  BellOutlined, 
  SearchOutlined,
  SettingOutlined,
  HeartOutlined,
  ShareAltOutlined,
  CommentOutlined,
  CameraOutlined,
  SendOutlined
} from '@ant-design/icons';
import { getCurrentUser, searchUsers, getUser, getUserFriends, getAllUsers } from '../api/userApi';
import { logout } from '../api/authApi';
import { useNavigate } from 'react-router-dom';
import { sendFriendRequest, getPendingFriendships, acceptFriendRequest, rejectFriendRequest } from '../api/friendshipApi';
import Navbar from '../components/Navbar';

const { Title, Paragraph, Text } = Typography;

const CHAT_SERVICE_URL = 'http://localhost:5000';
const CHAT_NAMESPACE = '/api/messages';

const UserPage = () => {
  // --- Navigation state ---
  const [activeNav, setActiveNav] = useState('home');
  
  // --- Notification state ---
  const [notifications, setNotifications] = useState([]);
  
  // --- Friend suggestions ---
  const [friendSuggestions, setFriendSuggestions] = useState([]); // You can implement this dynamically if backend supports


  // --- Post states ---
  const [postContent, setPostContent] = useState('');
  const [postMedia, setPostMedia] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [loadingMyPosts, setLoadingMyPosts] = useState(false);

  // --- Edit Post Modal State ---
  const [editingPost, setEditingPost] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editMedia, setEditMedia] = useState([]);
  const [editUploading, setEditUploading] = useState(false);


  // User state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Friends state
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  // Last messages state
  const [lastMessages, setLastMessages] = useState({});

  // Friend requests state
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Search state
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);

  // Handle user search (from UserPage2.js)
  const handleSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    try {
      const res = await searchUsers(search.trim());
      setResults(res.data.filter(u => u.username !== user.username));
    } catch (err) {
      message.error("Failed to search users");
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  // Chat states
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [editingMsgId, setEditingMsgId] = useState(null);
    const [reactingMsgId, setReactingMsgId] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // All users for chat list
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState('');

  // Refs
  const socketRef = useRef(null);
  const chatBoxRef = useRef(null);
  const navigate = useNavigate();

  // Helper function to format time
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

  // Handle Edit Post (open modal)
  const handleEditPost = (post) => {
    setEditingPost(post);
    setEditContent(post.content);
    setEditMedia(post.media || []);
    setEditModalVisible(true);
  };

  // Handle Edit Media Change
  const handleEditMediaChange = (e) => {
    setEditMedia(Array.from(e.target.files));
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
      setEditModalVisible(false);
      setEditingPost(null);
      setEditContent('');
      setEditMedia([]);
      fetchMyPostsHandler();
    } catch (err) {
      message.error('Failed to update post');
    } finally {
      setEditUploading(false);
    }
  };

  // Handle Delete Post
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await deletePost(postId);
      message.success('Post deleted');
      fetchMyPostsHandler();
    } catch {
      message.error('Failed to delete post');
    }
  };

  // Fetch friends
  const fetchFriends = async () => {
    if (!user?._id) return;
    setLoadingFriends(true);
    try {
      const res = await getUserFriends(user._id);
      setFriends(res.data);
    } catch {
      setFriends([]);
    } finally {
      setLoadingFriends(false);
    }
  };

  // Fetch last message for each friend
  useEffect(() => {
    const fetchLastMessages = async () => {
      if (!user?._id || friends.length === 0) return;
      const newLastMessages = {};
      await Promise.all(friends.map(async (friend) => {
        try {
          const res = await getMessages(friend._id);
          if (Array.isArray(res.data) && res.data.length > 0) {
            newLastMessages[friend._id] = res.data[res.data.length - 1];
          }
        } catch (err) {
          // ignore errors for individual friends
        }
      }));
      setLastMessages(newLastMessages);
    };
    fetchLastMessages();
    // eslint-disable-next-line
  }, [friends, user?._id]);

  // Fetch pending friend requests
  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await getPendingFriendships();
      let requests = res.data;
      setPendingRequests(requests);
    } catch {
      setPendingRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Fetch notifications (via socket)
  useEffect(() => {
    if (!user) return;
    // Connect socket for notifications (reuse chat socket or create new one)
    if (!socketRef.current) {
      socketRef.current = io(CHAT_SERVICE_URL + CHAT_NAMESPACE, {
        path: '/api/messages/socket.io/',
        auth: { token: localStorage.getItem('jwt') },
        transports: ['websocket']
      });
      socketRef.current.emit('join', user._id);
      socketRef.current.on('private_message', msg => {
        if (msg.senderId !== user._id) {
          setNotifications(prev => [{
            type: 'message',
            from: msg.senderId,
            content: msg.content,
            timestamp: new Date(msg.createdAt),
            read: false
          }, ...prev]);
          // Increment unread count for sender
          setUnreadCounts(prev => ({
            ...prev,
            [msg.senderId]: (prev[msg.senderId] || 0) + 1
          }));
          message.info('New message: ' + (msg.content?.slice(0, 50) || ''));
        }
      });
      // Listen for friend request notifications
      socketRef.current.on('friend_request_received', data => {
        if (data.recipientId === user._id) {
          setNotifications(prev => [{
            type: 'friend_request',
            from: data.senderId,
            content: `${data.senderUsername} sent you a friend request`,
            timestamp: new Date(),
            read: false
          }, ...prev]);
          message.info(`${data.senderUsername} sent you a friend request`);
          // Optionally refresh pending requests
          fetchRequests();
        }
      });
    }
  }, [user]);

  // Fetch chat messages when friend is selected
  useEffect(() => {
    const fetchMsgs = async () => {
      if (!selectedFriend || !user) return;
      setChatLoading(true);
      try {
        const res = await getMessages(selectedFriend._id);
        setChatMessages(res.data);
        // Mark messages as read for this friend
        setUnreadCounts(prev => ({ ...prev, [selectedFriend._id]: 0 }));
      } catch {
        setChatMessages([]);
      } finally {
        setChatLoading(false);
      }
    };
    fetchMsgs();
  }, [selectedFriend, user]);

  // Fetch all on user change
  useEffect(() => {
    if (user?._id) {
      fetchMyPostsHandler();
      fetchFriends();
      fetchRequests();
      fetchAllUsers();
    }
  }, [user?._id]);

  // Fetch all users for chat list
  const fetchAllUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await getAllUsers();
      // Exclude self
      setAllUsers(Array.isArray(res.data) ? res.data.filter(u => u._id !== user._id) : []);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setAllUsers([]);
        // Optionally, set a message for the UI
        setUsersError('User list is not available.');
      } else {
        setAllUsers([]);
        setUsersError('Failed to load users.');
      }
    } finally {
      setLoadingUsers(false);
    }
  };

  // Remove static feedPosts and use myPosts for feed
  const feedPosts = myPosts;

  // Fetch user from backend
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getCurrentUser();
        setUser(res.data);
      } catch (err) {
        message.error('Failed to load user info. Please login again.');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // Handle post actions
  const handleLikePost = (postId) => {
    setMyPosts(prev => prev.map(post => 
      post._id === postId 
        ? { 
            ...post, 
            liked: !post.liked,
            likes: post.liked ? post.likes - 1 : post.likes + 1
          }
        : post
    ));
  };

  const handleSharePost = (postId) => {
    setMyPosts(prev => prev.map(post => 
      post._id === postId 
        ? { 
            ...post, 
            shared: !post.shared,
            shares: post.shared ? post.shares - 1 : post.shares + 1
          }
        : post
    ));
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

  // Handle post creation
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
      fetchMyPostsHandler();
    } catch (err) {
      message.error('Failed to create post');
    }
  };

  // Render navigation menu
  const renderNavigation = () => (
    <div className="nav-menu">
      <div 
        className={`nav-item ${activeNav === 'home' ? 'active' : ''}`}
        onClick={() => setActiveNav('home')}
      >
        <HomeOutlined className="nav-icon" />
        Home
      </div>
      <div 
        className={`nav-item ${activeNav === 'messages' ? 'active' : ''}`}
        onClick={() => setActiveNav('messages')}
      >
        <MessageOutlined className="nav-icon" />
        Messages
      </div>
      <div 
        className={`nav-item ${activeNav === 'friends' ? 'active' : ''}`}
        onClick={() => setActiveNav('friends')}
      >
        <UserOutlined className="nav-icon" />
        Friends
      </div>
      <div 
        className={`nav-item ${activeNav === 'search' ? 'active' : ''}`}
        onClick={() => setActiveNav('search')}
      >
        <SearchOutlined className="nav-icon" />
        Discover
      </div>
      <div 
        className={`nav-item ${activeNav === 'posts' ? 'active' : ''}`}
        onClick={() => setActiveNav('posts')}
      >
        <CameraOutlined className="nav-icon" />
        My Posts
      </div>
      <div 
        className={`nav-item ${activeNav === 'settings' ? 'active' : ''}`}
        onClick={() => setActiveNav('settings')}
      >
        <SettingOutlined className="nav-icon" />
        Settings
      </div>
    </div>
  );

  // Handle sending a chat message
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedFriend) return;
    const msg = {
      senderId: user._id,
      receiverId: selectedFriend._id,
      content: chatInput,
      createdAt: new Date().toISOString(),
      _id: Math.random().toString(36).slice(2) // temporary ID for React
    };
    // Instantly show the message in the conversation
    setChatMessages(prev => [...prev, msg]);
    setChatInput('');
    // Ensure socket is connected and joined
    if (!socketRef.current) {
      socketRef.current = io(CHAT_SERVICE_URL + CHAT_NAMESPACE, {
        path: '/api/messages/socket.io/',
        auth: { token: localStorage.getItem('jwt') },
        transports: ['websocket']
      });
      socketRef.current.emit('join', user._id);
      // Listen for incoming messages
      socketRef.current.on('private_message', (newMsg) => {
        setChatMessages(prev => [...prev, newMsg]);
      });
    }
    // Emit via Socket.IO
    socketRef.current.emit('private_message', msg);
    // Persist via REST
    try {
      await sendChatMessage({ receiverId: selectedFriend._id, content: msg.content });
    } catch (err) {
      message.error('Failed to send message to server');
    }
    // Scroll chat box to bottom after sending
    setTimeout(() => {
      if (chatBoxRef.current) {
        chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
      }
    }, 100);
  };

  // Render main content based on active navigation
  const renderMainContent = () => {
    switch (activeNav) {
      case 'home':
        return (
          <>
            {/* Post Creation */}
            <div className="post-creation">
              <div className="post-creation-header">
                <Avatar 
                  src={user?.avatar || undefined} 
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
              {feedPosts.map(post => {
                // Support: post.author may be an object or just an ID
                let authorObj = post.author;
                if (authorObj && typeof authorObj === 'string') {
                  // Try to get from cache or fetch
                  if (!window._userCache) window._userCache = {};
                  if (!window._userCache[authorObj]) {
                    // Fire-and-forget fetch, will update on next render
                    getUser(authorObj).then(res => {
                      window._userCache[authorObj] = res.data;
                      // Force re-render
                      setMyPosts(posts => [...posts]);
                    }).catch(() => {
                      window._userCache[authorObj] = { username: 'Unknown' };
                    });
                    authorObj = { username: 'Loading...' };
                  } else {
                    authorObj = window._userCache[authorObj];
                  }
                }
                // Explicitly return JSX here
                return (
                  <div key={post._id} className="post-card">
                    <div className="post-header">
                      <Avatar 
                        src={authorObj?.avatar || undefined} 
                        icon={<UserOutlined />} 
                        size={40}
                      />
                      <div className="post-author-info">
                        <div className="post-author-name">{authorObj?.username || 'Unknown'}</div>
                        <div className="post-time">{formatTime(post.timestamp)}</div>
                      </div>
                    </div>
                    <div className="post-content">{post.content}</div>
                    {post.media && post.media.length > 0 && (
  <div className="post-media">
    {post.media.map((url, idx) => {
      const isBlobUrl = url && url.startsWith('blob:');
      // Rewrite backend media URLs to go through the gateway
      let displayUrl = url;
      if (url && url.startsWith('http://localhost:5003/uploads/')) {
        const filename = url.split('/uploads/')[1];
        displayUrl = `${process.env.REACT_APP_GATEWAY_BASE_URL || 'http://localhost:5000/api'}/media/uploads/${filename}`;
      }
      return isBlobUrl ? (
        <div key={idx} className="post-media-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#aaa', fontSize: 16 }}>
          <span role="img" aria-label="broken">🚫</span>
        </div>
      ) : (
        displayUrl.match(/\.(mp4|webm|ogg)$/i) ? (
          <video key={idx} src={displayUrl} controls className="post-media-item" style={{ objectFit: 'cover' }} />
        ) : (
          <img key={idx} src={displayUrl} alt="post media" className="post-media-item" />
        )
      );
    })}
  </div>
)}
                    <div className="post-actions">
  <div 
    className={`post-action ${post.liked ? 'liked' : ''}`}
    onClick={() => handleLikePost(post._id)}
  >
    <HeartOutlined />
    <span>{post.likes}</span>
  </div>
  <div className="post-action">
    <CommentOutlined />
    <span>{post.comments}</span>
  </div>
  <div 
    className={`post-action ${post.shared ? 'shared' : ''}`}
    onClick={() => handleSharePost(post._id)}
  >
    <ShareAltOutlined />
    <span>{post.shares}</span>
  </div>
  {/* Edit/Delete for author */}
  {user && post.author && (post.author._id ? post.author._id === user._id : post.author === user._id) && (
    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
      <Button size="small" onClick={() => handleEditPost(post)} style={{ marginRight: 4 }}>
        Edit
      </Button>
      <Button size="small" danger onClick={() => handleDeletePost(post._id)}>
        Delete
      </Button>
    </div>
  )}
</div>
                  </div>
                );
              })}
            </div>
          </>
        );

      case 'messages':
        return (
          <div className="chat-section">
            <div className="chat-header">
              <MessageOutlined style={{ marginRight: 8 }} />
              <Title level={4} style={{ margin: 0 }}>Messages</Title>
            </div>
            {selectedFriend ? (
              <>
                <Button onClick={() => setSelectedFriend(null)} style={{ marginBottom: 12 }}>Back to users</Button>
                <div className="chat-header">
                  <Avatar src={selectedFriend.avatar} icon={<UserOutlined />} />
                  <Title level={5} style={{ margin: 0, marginLeft: 12 }}>
                    {selectedFriend.username}
                  </Title>
                </div>
                <div ref={chatBoxRef} className="chat-box">
                  {chatLoading ? (
                    <div className="flex-center">
                      <Spin />
                    </div>
                  ) : chatMessages.length > 0 ? (
                    chatMessages.map((msg, idx) => {
                      const isSender = msg.senderId === user._id;
                      return (
                        <div key={msg._id || idx} className="chat-message">
                          <div className={`chat-bubble ${isSender ? 'chat-bubble-sender' : 'chat-bubble-receiver'}`}>
                            <span className="chat-message-content">{msg.content}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex-center">
                      <Text type="secondary">Start a conversation!</Text>
                    </div>
                  )}
                </div>
                <div className="chat-input-row">
                  <textarea
                    className="chat-input-box"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                  />
                  <Button
  type="primary"
  icon={<SendOutlined style={{ fontSize: 20 }} />}
  onClick={handleSendMessage}
  className="chat-send-btn"
  disabled={!chatInput.trim()}
  style={{ marginLeft: 8, minWidth: 40, minHeight: 40, borderRadius: 20, boxShadow: '0 2px 8px rgba(59,130,246,0.10)' }}
/>
                </div>
              </>
            ) : (
              <div className="users-list">
                {loadingUsers ? (
                  <div className="flex-center"><Spin /></div>
                ) : usersError && friends.length > 0 ? (
                  <div>
                    <div className="flex-center" style={{ marginBottom: 16 }}><Text type="danger">{usersError} Showing friends only.</Text></div>
                    <div className="friends-list">
                      {friends.map(u => (
                        <Card
                          key={u._id}
                          className="friend-card"
                          hoverable
                          onClick={() => setSelectedFriend(u)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Avatar src={u.avatar || undefined} icon={<UserOutlined />} size={40} />
                            <div>
                              <div style={{ fontWeight: 500 }}>{u.username}</div>
                              <div style={{ fontSize: 13, color: '#64748b' }}>{u.email}</div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : usersError && friends.length === 0 ? (
                  <div className="flex-center"><Text type="danger">{usersError} No friends available.</Text></div>
                ) : allUsers.length === 0 ? (
                  <div className="flex-center"><Text type="secondary">No users found.</Text></div>
                ) : (
                  <div className="friends-list">
                    {friends.map(u => (
  <Card
    key={u._id}
    className="friend-card"
    hoverable
    onClick={() => setSelectedFriend(u)}
    style={{ cursor: 'pointer' }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Avatar src={u.avatar || undefined} icon={<UserOutlined />} size={40} />
      <div>
        <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
  {u.username}
  {unreadCounts[u._id] > 0 && (
    <span className="chat-unread-badge">New msg ({unreadCounts[u._id]})</span>
  )}
</div>
<div style={{ fontSize: 13, color: '#64748b' }}>{u.email}</div>
        <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
          {lastMessages[u._id]?.content ? (
  <>
    
    <span style={{ fontWeight: 500 }}>
      {lastMessages[u._id].sender === user._id
        ? 'you: '
        : u.username + ': '
      }
    </span>
    {lastMessages[u._id].content.length > 40
      ? lastMessages[u._id].content.slice(0, 40) + '...'
      : lastMessages[u._id].content}
  </>
) : (
  <span style={{ fontStyle: 'italic', color: '#bbb' }}>No messages yet</span>
)}
        </div>
      </div>
    </div>
  </Card>
))}
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'friends':
        return (
          <div className="friends-section">
            <Title level={4}>Your Friends ({friends.length})</Title>
            {loadingFriends ? (
              <div className="flex-center" style={{ padding: 40 }}>
                <Spin size="large" />
              </div>
            ) : friends.length > 0 ? (
              <div className="friends-list">
                {friends.map(friend => (
                  <Card key={friend._id} className="friend-card">
                    <Card.Meta
                      avatar={<Avatar src={friend.avatar} icon={<UserOutlined />} />}
                      title={friend.username}
                      description={friend.email}
                    />
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex-center" style={{ padding: 40 }}>
                <Text type="secondary">You don’t have any friends yet.</Text>
              </div>
            )}
          </div>
        );

      case 'posts':
        return (
          <div className="my-posts-section">
            <Title level={4}>My Posts</Title>
            {loadingMyPosts ? (
              <div className="flex-center" style={{ padding: 40 }}>
                <Spin size="large" />
              </div>
            ) : myPosts.length > 0 ? (
              <div className="my-posts-list">
                {myPosts.map(post => (
                  <Card key={post._id} className="my-post-card">
                    <div className="my-post-content">{post.content}</div>
                    {post.media && post.media.length > 0 && (
                      <div className="my-post-media">
                        {post.media.map((url, idx) => {
                          let displayUrl = url;
                          if (url && url.startsWith('http://localhost:5003/uploads/')) {
                            const filename = url.split('/uploads/')[1];
                            displayUrl = `${process.env.REACT_APP_GATEWAY_BASE_URL || 'http://localhost:5000/api'}/media/uploads/${filename}`;
                          }
                          return <img key={idx} src={displayUrl} alt="media" className="my-post-media-img" />;
                        })}
                      </div>
                    )}
                    <div className="my-post-meta" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <Text type="secondary">{formatTime(new Date(post.createdAt))} {getStatusTag(post.status)}</Text>
                        <Tag color={post.status === 'approved' ? 'green' : post.status === 'pending' ? 'orange' : 'red'} style={{ marginLeft: 8 }}>
                          {post.status}
                        </Tag>
                      </div>
                      <div>
                        <Button size="small" style={{ marginRight: 8 }} onClick={() => handleEditPost(post)}>
                          Edit
                        </Button>
                        <Button size="small" danger onClick={() => handleDeletePost(post._id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex-center" style={{ padding: 40 }}>
                <Text type="secondary">You haven't created any posts yet.</Text>
              </div>
            )}
          </div>
        );

      case 'search':
        return (
          <div className="user-search-section">
            <Title level={4}>Discover People</Title>
            <div className="user-search-row">
              <input
                className="user-search-input"
                type="text"
                placeholder="Search for users..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
              />
              <Button 
                type="primary" 
                className="user-search-btn" 
                onClick={handleSearch}
                loading={searching}
                icon={<SearchOutlined />}
              >
                Search
              </Button>
            </div>
            {results.length > 0 && (
              <div className="search-results">
                {results.map(u => (
                  <Card key={u._id} className="search-result-card">
                    <Card.Meta
                      avatar={<Avatar src={u.avatar} icon={<UserOutlined />} size={48} />}
                      title={u.username}
                      description={u.email}
                    />
                    <Button
                      type="primary"
                      className="send-request-btn"
                      disabled={pendingRequests.some(r => r.recipient === u._id || r.requester === u._id)}
                      onClick={async () => {
                        try {
                          await sendFriendRequest(u._id);
                          message.success(`Friend request sent to ${u.username}`);
                          if (socketRef.current) {
                            socketRef.current.emit('friend_request', {
                              senderId: user._id,
                              recipientId: u._id,
                              senderUsername: user.username,
                            });
                          }
                        } catch (err) {
                          console.error('Friend request error:', err?.response?.data || err);
                          message.error(
                            err?.response?.data?.message ||
                            'Failed to send friend request'
                          );
                        }
                      }}
                    >
                      {pendingRequests.some(r => r.recipient === u._id || r.requester === u._id) ? 'Request Sent' : 'Add Friend'}
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="flex-center" style={{ height: 300 }}>
            <Text type="secondary">Coming soon...</Text>
          </div>
        );
    }
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
      <Navbar 
        isAdmin={user.role === 'admin'} 
        onLogout={handleLogout} 
        username={user.username}
      />
  
      <div className="user-main">
        {/* Left Sidebar */}
        <div className="left-sidebar">
          {/* Profile Card */}
          <div className="profile-card">
            <Avatar 
              size={90} 
              src={user.avatar} 
              icon={<UserOutlined />} 
              className="profile-avatar"
            />
            <div className="profile-info">
              <Title level={3} className="profile-title">{user.username}</Title>
              <Text className="profile-email">{user.email}</Text>
              <div className="profile-tags">
                <Tag color={user.isApproved ? 'green' : 'orange'}>
                  {user.isApproved ? 'Approved' : 'Pending'}
                </Tag>
                <Tag color={user.role === 'admin' ? 'red' : 'blue'}>
                  {user.role}
                </Tag>
              </div>
            </div>
            {user.bio && (
              <div className="profile-bio">
                <strong>Bio:</strong> {user.bio}
              </div>
            )}
          </div>
  
          {/* Navigation Menu */}
          {renderNavigation()}
        </div>
  
        {/* Main Content */}
        <div className="main-content">
          {renderMainContent()}
        </div>
  
        {/* Right Sidebar */}
        <div className="right-sidebar">
          {/* Notifications Panel */}
          <div className="notifications-panel">
            <div className="notifications-header">
              <span className="notifications-title">
                <BellOutlined style={{ marginRight: 8 }} />
                Notifications
              </span>
              {notifications.some(n => !n.read) && (
                <span className="notification-badge">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </div>
            <div className="notifications-list">
              {notifications.slice(0, 5).map((notification, idx) => (
                <div 
                  key={idx} 
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                >
                  <Avatar 
                    size={32} 
                    icon={<UserOutlined />} 
                    className="notification-avatar"
                  />
                  <div className="notification-content">
                    <div className="notification-text">
                      <strong>{notification.from || 'User'}</strong> {notification.content}
                    </div>
                    <div className="notification-time">
                      {formatTime(notification.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
  
          {/* Friend Suggestions */}
          <div className="friend-suggestions">
            <Title level={5}>People You May Know</Title>
            <div className="suggestions-list">
              {friendSuggestions.map(suggestion => (
                <div key={suggestion._id} className="suggestion-item">
                  <Avatar 
                    src={suggestion.avatar} 
                    icon={<UserOutlined />} 
                    size={40}
                  />
                  <div className="suggestion-info">
                    <div className="suggestion-name">{suggestion.username}</div>
                    <div className="suggestion-mutual">
                      {suggestion.mutualFriends} mutual friends
                    </div>
                  </div>
                  <Button 
                    type="primary" 
                    size="small"
                    className="suggestion-action"
                    onClick={() => message.success(`Friend request sent to ${suggestion.username}`)}
                  >
                    Add
                  </Button>
                </div>
              ))}
            </div>
          </div>
  
          {/* Pending Friend Requests */}
          {pendingRequests.length > 0 && (
            <div className="pending-requests">
              <Title level={5}>Friend Requests</Title>
              {pendingRequests.slice(0, 3).map(req => {
                const userInfo = req.requesterUser || req.requester || {};
                return (
                  <div key={req._id} className="request-item">
                    <Avatar 
                      icon={<UserOutlined />} 
                      src={userInfo.avatar} 
                      size={40}
                    />
                    <div className="request-info">
                      <div className="request-name">
                        {userInfo.username || 'Unknown User'}
                      </div>
                    </div>
                    <div className="request-actions">
                      <Button
                        type="primary"
                        size="small"
                        className="request-btn"
                        onClick={async () => {
                          try {
                            await acceptFriendRequest(req.requester);
                            setFriends(prev => prev.some(f => f._id === req.requesterUser?._id) ? prev : [...prev, req.requesterUser]);
                            await fetchRequests();
                            message.success('Friend request accepted');
                          } catch {
                            message.error('Failed to accept request');
                          }
                        }}
                      >
                        Accept
                      </Button>
                      <Button
                        size="small"
                        className="request-btn"
                        onClick={async () => {
                          try {
                            await rejectFriendRequest(req.requester);
                            await fetchRequests();
                            message.success('Friend request declined');
                          } catch {
                            message.error('Failed to decline request');
                          }
                        }}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UserPage;