import React, { useState, useEffect } from 'react';
import { Search, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { usersAPI } from '../services/api';
import { formatTime } from '../utils/formatTime';
import { useAuth } from '../contexts/AuthContext';

const UserList = ({ selectedUser, onUserSelect, onEditUser, onDeleteUser, refreshTrigger }) => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(null);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    loadUsers();
  }, [refreshTrigger]); // Add refreshTrigger as dependency

  const loadUsers = async () => {
    try {
      const response = await usersAPI.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMenuToggle = (userId, e) => {
    e.stopPropagation();
    setMenuOpen(menuOpen === userId ? null : userId);
  };

  const handleEdit = (user, e) => {
    e.stopPropagation();
    setMenuOpen(null);
    onEditUser(user);
  };

  const handleDelete = async (user, e) => {
    e.stopPropagation();
    setMenuOpen(null);
    
    if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
      try {
        await usersAPI.deleteUser(user._id);
        loadUsers();
        if (selectedUser && selectedUser._id === user._id) {
          onUserSelect(null);
        }
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">Chats</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">Chats</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filteredUsers.map((user) => (
          <div
            key={user._id}
            onClick={() => onUserSelect(user)}
            className={`flex items-center p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
              selectedUser && selectedUser._id === user._id ? 'bg-blue-50' : ''
            }`}
          >
            <div className="relative flex-shrink-0">
              <img
                className="h-12 w-12 rounded-full"
                src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                alt={user.name}
              />
              <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                user.isOnline ? 'bg-green-500' : 'bg-gray-400'
              }`} />
            </div>
            
            <div className="ml-3 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name}
                </p>
                {user._id !== currentUser.id && (
                  <div className="relative">
                    <button
                      onClick={(e) => handleMenuToggle(user._id, e)}
                      className="p-1 rounded-full hover:bg-gray-200"
                    >
                      <MoreVertical className="h-4 w-4 text-gray-500" />
                    </button>
                    
                    {menuOpen === user._id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                        <button
                          onClick={(e) => handleEdit(user, e)}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit User
                        </button>
                        <button
                          onClick={(e) => handleDelete(user, e)}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete User
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 truncate">{user.email}</p>
              <p className="text-xs text-gray-400">
                {user.isOnline ? 'Online' : `Last seen ${formatTime(user.lastSeen)}`}
              </p>
            </div>
          </div>
        ))}
        
        {filteredUsers.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            No users found
          </div>
        )}
      </div>
    </div>
  );
};

export default UserList;