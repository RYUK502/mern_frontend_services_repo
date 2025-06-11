import React from 'react';
import { Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const SearchBar = ({ search, setSearch, handleSearch, searching }) => (
  <div className="user-search-row">
    <input
      className="user-search-input"
      type="text"
      placeholder="Search for users..."
      value={search}
      onChange={e => setSearch(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
    />
    <Button
      type="primary"
      className="user-search-btn"
      onClick={handleSearch}
      loading={searching}
      icon={<SearchOutlined />}
    >
      Search
    </Button>
  </div>
);

export default SearchBar;
