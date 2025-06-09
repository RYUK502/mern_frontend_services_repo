import React, { useEffect, useState } from 'react';
import './UserPage.css';
import { Card, Avatar, Button, Spin, Typography, message, Tag } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { getCurrentUser, searchUsers, getUser, getUserFriends } from '../api/userApi';
import { logout } from '../api/authApi';
import { useNavigate } from 'react-router-dom';
import { sendFriendRequest, getPendingFriendships, acceptFriendRequest, rejectFriendRequest } from '../api/friendshipApi';
import Navbar from '../components/Navbar';

const { Title, Paragraph, Text } = Typography;

const UserPage = () => {
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);

  const [user, setUser] = useState(null);   
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch current user info
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

  useEffect(() => {
    // Fetch pending friend requests
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

  // Fetch friends when user is loaded
  useEffect(() => {
    if (!user) return;
    setLoadingFriends(true);
    getUserFriends(user._id)
      .then(res => setFriends(res.data))
      .catch(() => setFriends([]))
      .finally(() => setLoadingFriends(false));
  }, [user]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Spin size="large" /></div>;
  }

  if (!user) return null;


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

  return (
    <>
      <Navbar isAdmin={user.role === 'admin'} onLogout={handleLogout} username={user.username} />
      <div className="user-main">
        {/* Inbox: Pending Friend Requests */}
        <div className="friend-inbox-section">
  <Title level={4} style={{ marginBottom: 8 }}>Friend Requests Inbox</Title>
  {loadingRequests ? <Spin /> : (
    pendingRequests.length > 0 ? (
      <div className="friend-inbox-list">
        {pendingRequests.map(req => (
  <Card key={req._id}>
    <div style={{ marginBottom: 4, fontWeight: 500 }}>
      Friend request from: <span style={{ color: '#1890ff' }}>
        {req.requesterUser?.username || req.requester}
      </span>
    </div>
    <Card.Meta
      avatar={<Avatar src={req.requesterUser?.avatar} icon={<UserOutlined />} />}
      title={req.requesterUser?.username || req.requester}
      description={
        <>
          {req.requesterUser?.email && (
            <div style={{ fontSize: 12, color: '#888' }}>{req.requesterUser.email}</div>
          )}
          {req.requesterUser?.bio && (
            <div style={{ fontSize: 12, color: '#888' }}>{req.requesterUser.bio}</div>
          )}
        </>
      }
    />
    <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
      <Button type="primary" onClick={() => handleAcceptRequest(req.requester, req._id)}>Accept</Button>
      <Button danger onClick={() => handleRejectRequest(req.requester, req._id)}>Reject</Button>
    </div>
  </Card>
))}
      </div>
    ) : (
      <Text type="secondary">No incoming friend requests.</Text>
    )
  )}
</div>
        <div className="profile-card">
          <Avatar size={90} src={user.avatar} icon={<UserOutlined />} className="profile-avatar" />
          <div className="profile-info">
            <Title level={3} className="mb-0">{user.username}</Title>
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
          <Paragraph>
            <b>Bio:</b> {user.bio || <Text type="secondary">No bio provided.</Text>}
          </Paragraph>
        </div>
        {/* Friends Section */}
        <div className="friends-section" style={{ marginTop: 24 }}>
          <Title level={4}>Your Friends</Title>
          {loadingFriends ? <Spin /> : (
            friends.length > 0 ? (
              <div className="friends-list">
                {friends.map(friend => (
                  <Card key={friend._id} style={{ marginBottom: 8 }}>
                    <Card.Meta
                      avatar={<Avatar src={friend.avatar} icon={<UserOutlined />} />}
                      title={friend.username}
                      description={friend.email}
                    />
                  </Card>
                ))}
              </div>
            ) : (
              <Text type="secondary">You have no friends yet.</Text>
            )
          )}
        </div>

        {/* User Search Section */}
        <div className="user-search-section">
          <Title level={4}>Search for Other Users</Title>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              type="text"
              placeholder="Enter username..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
              style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
            />
            <Button type="primary" onClick={handleSearch} loading={searching}>Search</Button>
          </div>
          {searching && <Spin />}
          {!searching && results.length > 0 && (
  <div className="search-results">
    {results.map(u => (
      <Card key={u._id || u.username} style={{ marginBottom: 8 }}>
        <Card.Meta
          avatar={<Avatar src={u.avatar} icon={<UserOutlined />} />}
          title={u.username}
        />
        <Button
          type="primary"
          style={{ marginTop: 8 }}
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