// src/pages/AdminOrdersPage.jsx
import React, { useEffect, useState } from 'react';
import './AdminOrdersPage.css';
import { Table, Button, Avatar, message, Card, Spin } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { fetchOrders, approveOrder, rejectOrder } from '../api/adminApi';

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetchOrders();
      setOrders(res.data);
    } catch {
      message.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleApprove = async (id) => {
    try {
      await approveOrder(id);
      message.success('User approved!');
      loadOrders();
    } catch {
      message.error('Failed to approve user');
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectOrder(id);
      message.success('Order rejected!');
      loadOrders();
    } catch {
      message.error('Failed to reject order');
    }
  };

  const columns = [
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
            onClick={() => handleApprove(record._id)}
          >
            Approve
          </Button>
          <Button
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => handleReject(record._id)}
          >
            Reject
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-4xl mx-auto mt-12">
      <Card className="shadow-lg">
        <h2 className="text-2xl font-bold mb-6">Pending Registration Orders</h2>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Spin size="large" />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={orders}
            rowKey="_id"
            pagination={false}
            locale={{ emptyText: 'No pending orders.' }}
          />
        )}
      </Card>
    </div>
  );
};

export default AdminOrdersPage;