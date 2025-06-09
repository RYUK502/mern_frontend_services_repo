// src/pages/AdminPage.jsx
import React, { useEffect, useState } from 'react';
import './AdminPage.css';
import { Table, Button, Avatar, message, Card, Tabs, Spin } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { fetchOrders, approveOrder, rejectOrder } from '../api/adminApi';
import { fetchApprovedPosts, fetchPendingPosts, approvePost, rejectPost } from '../api/postApi';
import { logout } from '../api/authApi';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const { TabPane } = Tabs;

const AdminPage = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState({ username: 'Admin', role: 'admin' }); // Replace with real admin info if available

  // Orders state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Posts state
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);

  // Load orders
  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await fetchOrders();
      setOrders(res.data);
    } catch {
      message.error('Failed to fetch orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  // Load posts
  const loadPosts = async () => {
    setPostsLoading(true);
    try {
      const res = await fetchApprovedPosts();
      setPosts(res.data);
    } catch {
      message.error('Failed to fetch posts');
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    loadPosts();
  }, []);

  // Order actions
  const handleApproveOrder = async (id) => {
    try {
      await approveOrder(id);
      message.success('User approved!');
      loadOrders();
    } catch {
      message.error('Failed to approve user');
    }
  };

  const handleRejectOrder = async (id) => {
    try {
      await rejectOrder(id);
      message.success('Order rejected!');
      loadOrders();
    } catch {
      message.error('Failed to reject order');
    }
  };

  // Post actions
  const handleApprovePost = async (id) => {
    try {
      await approvePost(id);
      message.success('Post approved!');
      loadPosts();
    } catch {
      message.error('Failed to approve post');
    }
  };

  const handleRejectPost = async (id) => {
    try {
      await rejectPost(id);
      message.success('Post rejected!');
      loadPosts();
    } catch {
      message.error('Failed to reject post');
    }
  };

  // Orders table columns
  const orderColumns = [
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Bio', dataIndex: 'bio', key: 'bio', render: (bio) => bio || '—' },
    {
      title: 'Avatar',
      dataIndex: 'avatar',
      key: 'avatar',
      render: (avatar) =>
        avatar ? <Avatar src={avatar} size={32} /> : '—'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            className="bg-green-500 hover:bg-green-600 border-none"
            onClick={() => handleApproveOrder(record._id)}
          >
            Approve
          </Button>
          <Button
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => handleRejectOrder(record._id)}
          >
            Reject
          </Button>
        </div>
      )
    }
  ];

  // Posts table columns
  const postColumns = [
    { title: 'Title', dataIndex: 'title', key: 'title' },
    { title: 'Author', dataIndex: 'author', key: 'author' },
    { title: 'Category', dataIndex: 'category', key: 'category' },
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      render: (img) =>
        img ? (
          <Avatar shape="square" src={img} size={40} />
        ) : (
          '—'
        )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span className={
          status === 'approved'
            ? 'text-green-600'
            : status === 'pending'
            ? 'text-blue-600'
            : 'text-red-600'
        }>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            className="bg-green-500 hover:bg-green-600 border-none"
            onClick={() => handleApprovePost(record._id)}
            disabled={record.status === 'approved'}
          >
            Approve
          </Button>
          <Button
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => handleRejectPost(record._id)}
            disabled={record.status === 'rejected'}
          >
            Reject
          </Button>
        </div>
      )
    }
  ];

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

  return (
    <>
      <Navbar isAdmin={true} onLogout={handleLogout} username={admin.username} />
      <div className="max-w-5xl mx-auto mt-12">
        <Card className="shadow-lg">
          <Tabs defaultActiveKey="orders" tabBarGutter={32}>
            <TabPane tab="User Registration Orders" key="orders">
              <h2 className="text-xl font-bold mb-6">Pending Registration Orders</h2>
              {ordersLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Spin size="large" />
                </div>
              ) : (
                <Table
                  columns={orderColumns}
                  dataSource={orders}
                  rowKey="_id"
                  pagination={false}
                  locale={{ emptyText: 'No pending orders.' }}
                />
              )}
            </TabPane>
            <TabPane tab="Posts Moderation" key="posts">
              <h2 className="text-xl font-bold mb-6">Posts Moderation</h2>
              {postsLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Spin size="large" />
                </div>
              ) : (
                <Table
                  columns={postColumns}
                  dataSource={posts}
                  rowKey="_id"
                  pagination={false}
                  locale={{ emptyText: 'No posts.' }}
                />
              )}
            </TabPane>
          </Tabs>
        </Card>
      </div>
    </>
  );
};

export default AdminPage;