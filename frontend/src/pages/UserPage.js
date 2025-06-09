import React, { useEffect, useState } from 'react';
import './UserPage.css';
import { Card, Avatar, Button, Spin, Typography, message, Tag } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { getCurrentUser } from '../api/userApi';
import { logout } from '../api/authApi';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const { Title, Paragraph, Text } = Typography;

const UserPage = () => {
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

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Spin size="large" /></div>;
  }

  if (!user) return null;

  return (
    <>
      <Navbar isAdmin={user.role === 'admin'} onLogout={handleLogout} username={user.username} />
      <div className="user-main">
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
      </div>
    </>
  );
};

export default UserPage;