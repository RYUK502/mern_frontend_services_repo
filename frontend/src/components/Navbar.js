import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { LogoutOutlined, UserOutlined, HomeOutlined } from '@ant-design/icons';
import './Navbar.css';

const Navbar = ({ isAdmin, onLogout, username, onNavigate }) => {
  const navigate = useNavigate();
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to={isAdmin ? "/admin" : "/user"} className="navbar-logo">
          <HomeOutlined className="navbar-home-icon" />
          <span className="navbar-title">PrivetNet</span>
        </Link>
      </div>
      <div className="navbar-center">
        {isAdmin ? (
          <>
            <Link to="/admin" className="navbar-link">Dashboard</Link>
            <Link to="/admin" className="navbar-link">Moderation</Link>
          </>
        ) : (
          <>
            <Button className="navbar-link" onClick={() => onNavigate && onNavigate('messages')}>Messages</Button>
            <Button className="navbar-link" onClick={() => onNavigate && onNavigate('profile')}>Profile</Button>
            <Button className="navbar-link" onClick={() => onNavigate && onNavigate('friends')}>Friends</Button>
            <Button className="navbar-link" onClick={() => onNavigate && onNavigate('discover')}>Discover</Button>
          </>
        )}
      </div>
      <div className="navbar-right">
        <span className="navbar-username">
          <UserOutlined className="navbar-user-icon" />
          {username}
        </span>
        <Button
          type="primary"
          danger
          icon={<LogoutOutlined />}
          className="navbar-logout-btn"
          onClick={onLogout}
        >
          Logout
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;
