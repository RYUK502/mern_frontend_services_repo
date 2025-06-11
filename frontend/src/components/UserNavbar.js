// import React from 'react';
// import { Button } from 'antd';
// import { MessageOutlined, UserOutlined, TeamOutlined, CompassOutlined, LogoutOutlined } from '@ant-design/icons';
// import './Navbar.css';
//
// const UserNavbar = ({ username, onLogout, onNavigate }) => {
//   return (
//     <nav className="navbar">
//       <div className="navbar-left">
//         <span className="navbar-logo">
//           <span className="navbar-title">PrivetNet</span>
//         </span>
//       </div>
//       <div className="navbar-center">
//         <Button
//           className="navbar-link"
//           icon={<MessageOutlined />}
//           onClick={() => onNavigate('messages')}
//         >
//           Messages
//         </Button>
//         <Button
//           className="navbar-link"
//           icon={<UserOutlined />}
//           onClick={() => onNavigate('profile')}
//         >
//           Profile
//         </Button>
//         <Button
//           className="navbar-link"
//           icon={<TeamOutlined />}
//           onClick={() => onNavigate('friends')}
//         >
//           Friends
//         </Button>
//         <Button
//           className="navbar-link"
//           icon={<CompassOutlined />}
//           onClick={() => onNavigate('discover')}
//         >
//           Discover
//         </Button>
//       </div>
//       <div className="navbar-right">
//         <span className="navbar-username">
//           <UserOutlined className="navbar-user-icon" />
//           {username}
//         </span>
//         <Button
//           type="primary"
//           danger
//           icon={<LogoutOutlined />}
//           className="navbar-logout-btn"
//           onClick={onLogout}
//         >
//           Logout
//         </Button>
//       </div>
//     </nav>
//   );
// };
//
// export default UserNavbar;
