import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { LogoutOutlined, UserOutlined, HomeOutlined } from '@ant-design/icons';
import './Navbar.css';

const Navbar = ({ isAdmin, onLogout, username }) => {
  const navigate = useNavigate();
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to={isAdmin ? "/admin" : "/user"} className="navbar-logo">
          <HomeOutlined style={{ fontSize: 22, marginRight: 8 }} />
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
            <Link to="/user" className="navbar-link">Profile</Link>
            <Link to="/user" className="navbar-link">Feed</Link>
          </>
        )}
      </div>
      <div className="navbar-right">
        <span className="navbar-username">
          <UserOutlined style={{ marginRight: 4 }} />
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
