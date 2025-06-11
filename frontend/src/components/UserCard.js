import React from 'react';
import { Card, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';

const UserCard = ({ user, extra, onClick }) => (
  <Card
    className="user-card"
    hoverable={!!onClick}
    onClick={onClick}
    style={onClick ? { cursor: 'pointer' } : {}}
  >
    <Card.Meta
      avatar={<Avatar src={user.avatar} icon={<UserOutlined />} size={48} />}
      title={user.username}
      description={user.email}
    />
    {extra}
  </Card>
);

export default UserCard;
