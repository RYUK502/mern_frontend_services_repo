import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

import { getMessages, sendMessage as sendChatMessage, updateMessage, deleteMessage, reactToMessage } from '../api/chatApi';
import { fetchMyPosts, updatePost, deletePost } from '../api/postApi';
import Accueil from '../components/Accueil';
import './UserPage.css';
import { Card, Avatar, Button, Spin, Typography, message, Tag } from 'antd';
import { 
  LogoutOutlined, 
  UserOutlined, 
  HomeOutlined, 
  MessageOutlined, 
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
import { resolveAvatarUrl } from '../utils/helpers';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';
import MessagesSection from '../components/MessagesSection';
import UserCard from '../components/UserCard';
import SearchBar from '../components/SearchBar';
import ProfilePage from './ProfilePage';

// Helper functions
const formatTime = (date) => {
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h';
  if (diff < 604800000) return Math.floor(diff / 86400000) + 'd';
  return date.toLocaleDateString();
};

const getStatusTag = (status) => {
  switch (status) {
    case 'approved':
      return '✓ Approved';
    case 'pending':
      return '⏳ Pending';
    case 'rejected':
      return '❌ Rejected';
    default:
      return status;
  }
};

const { Title, Paragraph, Text } = Typography;

const CHAT_SERVICE_URL = 'http://localhost:5000';
const CHAT_NAMESPACE = '/';

const UserPage = () => {

  // Section refs for navbar navigation
  const messagesRef = React.useRef(null);
  const profileRef = React.useRef(null);
  const friendsRef = React.useRef(null);
  const discoverRef = React.useRef(null);

  // Handler for navbar navigation
  const handleNavbarNavigate = (section) => {
    let ref = null;
    switch (section) {
      case 'messages':
        ref = messagesRef;
        break;
      case 'profile':
        ref = profileRef;
        break;
      case 'friends':
        ref = friendsRef;
        break;
      case 'discover':
        ref = discoverRef;
        break;
      default:
        break;
    }
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // --- Navigation state ---
  const [activeNav, setActiveNav] = useState('home');
  
  // --- Friend suggestions ---
  const [friendSuggestions, setFriendSuggestions] = useState([]); // You can implement this dynamically if backend supports



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



  // Render navigation menu
  const renderNavigation = () => (
    <div className="nav-menu">
      <div 
        className={`nav-item ${activeNav === 'profile' ? 'active' : ''}`}
        onClick={() => setActiveNav('profile')}
      >
        <UserOutlined className="nav-icon" />
        Profile
      </div>
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
        path: '/api/messages/socket.io',
        auth: { token: localStorage.getItem('jwt') },
        transports: ['websocket'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        upgrade: false // Disable HTTP long-polling
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
    if (activeNav === 'profile') {
      return <ProfilePage user={user} setUser={setUser} />;
    }
    switch (activeNav) {
      case 'home':
        return (
          <Accueil user={user} />
        );

      case 'messages':
        return (
          <div className="chat-section">
            <div className="chat-header">
              <MessageOutlined style={{ marginRight: 8 }} />
              <Title level={4} style={{ margin: 0 }}>Messages</Title>
            </div>
            <MessagesSection
  selectedFriend={selectedFriend}
  setSelectedFriend={setSelectedFriend}
  chatMessages={chatMessages}
  chatInput={chatInput}
  setChatInput={setChatInput}
  chatLoading={chatLoading}
  handleSendMessage={handleSendMessage}
  loadingUsers={loadingUsers}
  usersError={usersError}
  friends={friends}
  allUsers={allUsers}
  unreadCounts={unreadCounts}
  lastMessages={lastMessages}
  user={user}
/>
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
  <UserCard key={friend._id} user={friend} />
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
            <Accueil user={user} />
          </div>
        );

      case 'search':
        return (
          <div className="user-search-section">
            <Title level={4}>Discover People</Title>
            <div className="user-search-row">
              <SearchBar 
                search={search}
                setSearch={setSearch}
                handleSearch={handleSearch}
                searching={searching}
              />
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
                          if (socketRef.current) {
                            socketRef.current.emit('friend_request', {
                              senderId: user._id,
                              recipientId: u._id,
                              senderUsername: user.username,
                            });
                          }
                        } catch (err) {
                          console.error('Friend request error:', err?.response?.data || err);
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
        onNavigate={user.role !== 'admin' ? handleNavbarNavigate : undefined}
      />
  
      <div className="user-main" style={{marginTop: 64}}>

         {/* Left Sidebar */}
         <div className="left-sidebar">
          {/* Profile Card */}
          <div ref={profileRef} className="profile-card">
            <Avatar 
              size={90} 
              src={resolveAvatarUrl(user?.avatar)} 
              icon={<UserOutlined />} 
              className="profile-avatar"
              style={{ cursor: 'pointer' }}
              onClick={() => setActiveNav('profile')}
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
          {/* Friend Requests */}
          {pendingRequests.length > 0 && (
            <div className="pending-requests">
              <Title level={5}>Friend Requests</Title>
              {pendingRequests.slice(0, 3).map(req => {
                const userInfo = req.requesterUser || req.requester || {};
                return (
                  <div key={req._id} className="request-item">
                    <Avatar 
                      icon={<UserOutlined />} 
                      src={resolveAvatarUrl(userInfo.avatar)} 
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