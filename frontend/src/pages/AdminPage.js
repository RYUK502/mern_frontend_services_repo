import React, { useEffect, useState } from 'react';
import './AdminPage.css';
import { Table, Button, message, Card, Tabs, Spin } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { fetchOrders, approveOrder, rejectOrder } from '../api/adminApi';
import {
  fetchApprovedPosts,
  fetchPendingPosts,
  approvePost,
  rejectPost
} from '../api/postApi';
import { logout } from '../api/authApi';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const { TabPane } = Tabs;

const AdminPage = () => {
  const navigate = useNavigate();
  const [admin] = useState({ username: 'Admin', role: 'admin' });

  // Orders state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Approved posts state
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);

  // Pending posts state
  const [pendingPosts, setPendingPosts] = useState([]);
  const [pendingPostsLoading, setPendingPostsLoading] = useState(true);

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

  // Load approved posts
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

  // Load pending posts
  const loadPendingPosts = async () => {
    setPendingPostsLoading(true);
    try {
      const res = await fetchPendingPosts();
      setPendingPosts(res.data);
    } catch {
      message.error('Failed to fetch pending posts');
    } finally {
      setPendingPostsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    loadPosts();
    loadPendingPosts();
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

  // Approved post actions
  const handleApprovePost = async (id) => {
    try {
      await approvePost(id);
      message.success('Post approved!');
      loadPosts();
      loadPendingPosts();
    } catch {
      message.error('Failed to approve post');
    }
  };

  const handleRejectPost = async (id) => {
    try {
      await rejectPost(id);
      message.success('Post rejected!');
      loadPosts();
      loadPendingPosts();
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
        avatar ? <img src={avatar} alt="avatar" style={{ width: 32, height: 32, borderRadius: '50%' }} /> : '—'
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

  // Posts table columns (for approved posts)
  const postColumns = [
    { title: 'ID', dataIndex: '_id', key: '_id' },
    { title: 'Content', dataIndex: 'content', key: 'content' },
    { title: 'User ID', dataIndex: 'userId', key: 'userId' },
    { title: 'Status', dataIndex: 'status', key: 'status',
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

  // Pending posts table columns
  const pendingPostColumns = [
    { title: 'ID', dataIndex: '_id', key: '_id' },
    { title: 'Content', dataIndex: 'content', key: 'content' },
    { title: 'User ID', dataIndex: 'userId', key: 'userId' },
    { title: 'Status', dataIndex: 'status', key: 'status',
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
          >
            Approve
          </Button>
          <Button
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => handleRejectPost(record._id)}
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
<Tabs
defaultActiveKey="orders"
tabBarGutter={32}
items={[
{
label: 'User Registration Orders',
key: 'orders',
children: (
<>
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
</>
),
},
{
label: 'Posts Moderation',
key: 'posts',
children: (
<>
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
</>
),
},
{
label: 'Pending Posts Moderation',
key: 'pending-posts',
children: (
<>
<h2 className="text-xl font-bold mb-6">Pending Posts Moderation</h2>
{pendingPostsLoading ? (
<div className="flex justify-center items-center h-40">
<Spin size="large" />
</div>
) : (
<Table
columns={pendingPostColumns}
dataSource={pendingPosts}
rowKey="_id"
pagination={false}
locale={{ emptyText: 'No pending posts.' }}
/>
)}
</>
),
},
]}
/>
</Card>
</div>
</>
);
};

export default AdminPage;