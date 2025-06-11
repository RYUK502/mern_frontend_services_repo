import React, { useState, useRef } from 'react';
import { Avatar, Button, Input, Form, message, Modal } from 'antd';
import { UserOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import './ProfilePage.css';

import { updateCurrentUser, getCurrentUser } from '../api/userApi';
import { uploadAvatar } from '../api/userApi';
const removeAvatar = async () => Promise.resolve({ success: true });
const deleteAccount = async (password) => Promise.resolve({ success: true });

const ProfilePage = ({ user, setUser }) => {
  const [avatar, setAvatar] = useState(user?.avatar || null);
const [avatarFile, setAvatarFile] = useState(null);
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [passwords, setPasswords] = useState({ old: '', new: '' });
  const [loading, setLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const fileInputRef = useRef();

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatar(URL.createObjectURL(file)); // preview
    }
  };

  const handleRemoveAvatar = async () => {
    setLoading(true);
    try {
      await removeAvatar();
      setAvatar(null);
      message.success('Avatar removed.');
      setUser && setUser(prev => ({ ...prev, avatar: null }));
    } catch {
      message.error('Failed to remove avatar.');
    }
    setLoading(false);
  };

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      let avatarUrl = avatar;
      // If a new avatar file is selected, upload it first
      if (avatarFile) {
        const res = await uploadAvatar(avatarFile);
        avatarUrl = res.data.avatar;
      }
      const updateData = { username, email, avatar: avatarUrl };
      if (showPasswordFields) {
        updateData.oldPassword = passwords.old;
        updateData.newPassword = passwords.new;
      }
      await updateCurrentUser(updateData);
      message.success('Profile updated!');
      if (setUser) {
        let attempts = 0;
        let latestUser = null;
        while (attempts < 3) {
          try {
            console.log('Fetching /auth/me attempt', attempts + 1);
            const res = await getCurrentUser();
            console.log('Fetched user from /auth/me:', res.data);
            latestUser = res.data;
            // If avatar matches the new avatar, break
            if (latestUser.avatar === avatarUrl) {
              setUser(latestUser);
              break;
            }
          } catch (err) {
            console.error('Error fetching /auth/me:', err);
            // fallback to local update if fetch fails
            setUser(prev => ({ ...prev, username, email, avatar: avatarUrl }));
            break;
          }
          // Wait 500ms before retrying
          await new Promise(res => setTimeout(res, 500));
          attempts++;
        }
        // If after retries avatar is still not updated, fallback to local update
        if (!latestUser || latestUser.avatar !== avatarUrl) {
          setUser(prev => ({ ...prev, username, email, avatar: avatarUrl }));
        }
      }
      setAvatarFile(null);
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to update profile.');
    }
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await deleteAccount(deletePassword);
      message.success('Account deleted.');
      // Redirect or log out user here
    } catch {
      message.error('Failed to delete account.');
    }
    setLoading(false);
    setDeleteModal(false);
    setDeletePassword('');
  };

  return (
    <div className="profile-container">
      <div className="profile-title">Profile Settings</div>
      <div className="profile-avatar-section">
        <Avatar
          src={avatar}
          icon={<UserOutlined />}
          size={96}
          className="profile-avatar-img"
        />
        <div className="profile-avatar-btns">
          <Button icon={<UploadOutlined />} onClick={() => fileInputRef.current.click()} loading={loading}>
            Upload
          </Button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />
          <Button icon={<DeleteOutlined />} danger onClick={handleRemoveAvatar} loading={loading}>
            Remove
          </Button>
        </div>
      </div>
      <Form layout="vertical" className="profile-form" onFinish={handleProfileUpdate}>
        <Form.Item label="Username">
          <Input value={username} onChange={e => setUsername(e.target.value)} />
        </Form.Item>
        <Form.Item label="Email">
          <Input value={email} onChange={e => setEmail(e.target.value)} />
        </Form.Item>
        <Form.Item>
          <Button type="link" onClick={() => setShowPasswordFields(v => !v)}>
            {showPasswordFields ? 'Cancel Password Change' : 'Change Password'}
          </Button>
        </Form.Item>
        {showPasswordFields && (
          <>
            <Form.Item label="Current Password" required>
              <Input.Password value={passwords.old} onChange={e => setPasswords(p => ({ ...p, old: e.target.value }))} />
            </Form.Item>
            <Form.Item label="New Password" required>
              <Input.Password value={passwords.new} onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))} />
            </Form.Item>
          </>
        )}
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>Update Profile</Button>
        </Form.Item>
      </Form>
      <div className="profile-delete-section">
  <Button className="profile-delete-btn" danger onClick={() => setDeleteModal(true)}>
    Delete Account
  </Button>
</div>
      <Modal
        title="Delete Account"
        open={deleteModal}
        onOk={handleDeleteAccount}
        onCancel={() => setDeleteModal(false)}
        okText="Delete"
        okButtonProps={{ danger: true }}
        confirmLoading={loading}
      >
        <p>Enter your password to confirm account deletion:</p>
        <Input.Password
          value={deletePassword}
          onChange={e => setDeletePassword(e.target.value)}
          placeholder="Password"
        />
      </Modal>
    </div>
  );
};

export default ProfilePage;
