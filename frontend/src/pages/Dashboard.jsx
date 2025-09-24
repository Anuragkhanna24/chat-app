import React, { useState } from 'react';
import { LogOut, UserPlus, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import UserList from '../components/UserList';
import ChatInterface from '../components/ChatInterface';
import UserModal from '../components/UserModal';

const Dashboard = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [refreshUsers, setRefreshUsers] = useState(0);
  const { user, logout } = useAuth();

  const handleUserSelect = (user) => {
    setSelectedUser(user);
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setIsUserModalOpen(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsUserModalOpen(false);
    setEditingUser(null);
  };

  const handleUserCreated = (newUser) => {
    // Refresh the user list
    setRefreshUsers(prev => prev + 1);
    // Optionally select the new user
    setSelectedUser(newUser);
  };

  const handleUserUpdated = (updatedUser) => {
    // Refresh the user list
    setRefreshUsers(prev => prev + 1);
    // Update the selected user if it's the one being edited
    if (selectedUser && selectedUser._id === updatedUser._id) {
      setSelectedUser(updatedUser);
    }
  };

  const handleRefreshUsers = () => {
    setRefreshUsers(prev => prev + 1);
  };

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar */}
      <UserList
        selectedUser={selectedUser}
        onUserSelect={handleUserSelect}
        onEditUser={handleEditUser}
        onDeleteUser={handleRefreshUsers}
        refreshTrigger={refreshUsers}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chat Application</h1>
            <p className="text-sm text-gray-500">Real-time messaging</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={handleRefreshUsers}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              title="Refresh users"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            
            <button
              onClick={handleAddUser}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </button>
            
            <div className="flex items-center space-x-3">
              <img
                className="h-8 w-8 rounded-full"
                src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=random`}
                alt={user?.name}
              />
              <span className="text-sm font-medium text-gray-700">{user?.name}</span>
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <ChatInterface selectedUser={selectedUser} />
      </div>

      {/* User Modal */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={handleCloseModal}
        user={editingUser}
        onUserCreated={handleUserCreated}
        onUserUpdated={handleUserUpdated}
      />
    </div>
  );
};

export default Dashboard;