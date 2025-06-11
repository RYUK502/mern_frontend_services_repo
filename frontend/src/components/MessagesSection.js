import React from 'react';
import './MessagesSection.css';
import { Spin, Avatar, Button, Typography, Card } from 'antd';
import { UserOutlined, MessageOutlined, SendOutlined } from '@ant-design/icons';
const { Title, Text } = Typography;

const MessagesSection = ({
  selectedFriend,
  setSelectedFriend,
  chatMessages,
  chatInput,
  setChatInput,
  chatLoading,
  handleSendMessage,
  loadingUsers,
  usersError,
  friends,
  allUsers,
  unreadCounts,
  lastMessages,
  user,
}) => (
  <div className="chat-section">
    <div className="chat-header">
      <MessageOutlined className="chat-header-icon" />
      <Title level={4} className="chat-header-title">Messages</Title>
    </div>
    {selectedFriend ? (
      <>
        <Button onClick={() => setSelectedFriend(null)} className="back-to-users-btn">Back to friends</Button>
        <div className="chat-header">
          <Avatar src={selectedFriend.avatar} icon={<UserOutlined />} />
          <Title level={5} className="selected-friend-title">{selectedFriend.username}</Title>
        </div>
        <div className="chat-box">
          {chatLoading ? (
            <div className="flex-center"><Spin /></div>
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
            <div className="flex-center"><Text type="secondary">Start a conversation!</Text></div>
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
          <>
            <div className="flex-center" style={{ marginBottom: 16 }}>
              <Text type="danger">{usersError} Showing friends only.</Text>
            </div>
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
          </>
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
                              : u.username + ': '}
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

export default MessagesSection;
