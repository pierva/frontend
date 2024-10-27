import React, { useEffect, useState } from 'react';
import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL;

function AdminUserManagement() {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'factory_user' });
    const [passwordChanges, setPasswordChanges] = useState({}); // Store password changes for users
    const [loggedAdmin, setLoggedAdmin] = useState(null); // Track logged admin

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem('token');
                const decodedToken = JSON.parse(atob(token.split('.')[1])); // Decode token payload
                setLoggedAdmin(decodedToken);

                const response = await axios.get(`${API_URL}/api/users`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUsers(response.data);
            } catch (error) {
                setError('Error fetching users. Only admins can access this page.');
            }
        };

        fetchUsers();
    }, []);

    const handleRoleChange = async (userId, newRole) => {
        // Prevent logged admin from changing their own role
        if (loggedAdmin && loggedAdmin.id === userId) {
            alert("You cannot change your own role.");
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${API_URL}/api/users/${userId}/role`,
                { role: newRole },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setUsers(users.map((user) => (user.id === userId ? { ...user, role: newRole } : user)));
        } catch (error) {
            setError('Failed to update role.');
        }
    };

    const handlePasswordChangeInput = (userId, newPassword) => {
        setPasswordChanges({ ...passwordChanges, [userId]: newPassword });
    };

    const handlePasswordSave = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${API_URL}/api/users/${userId}/password`,
                { password: passwordChanges[userId] },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            alert('Password updated successfully');
            setPasswordChanges({ ...passwordChanges, [userId]: '' });
        } catch (error) {
            setError('Failed to update password.');
        }
    };

    const handleAddUser = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_URL}/api/users/register`,
                newUser,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            alert('New user added successfully');
            setNewUser({ username: '', password: '', role: 'factory_user' });
            // Fetch updated users list
            const response = await axios.get(`${API_URL}/api/users`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(response.data);
        } catch (error) {
            setError('Failed to add user.');
        }
    };

    return (
        <div className='container'>
            <h2>Admin User Management</h2>
            {error && <div className="alert alert-danger">{error}</div>}

            {/* Add New User Form */}
            <div className="card p-3 mb-4">
                <h4>Add New User</h4>
                <div className="form-group mb-2">
                    <label>Username</label>
                    <input
                        type="text"
                        className="form-control"
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        placeholder="Enter username"
                    />
                </div>
                <div className="form-group mb-2">
                    <label>Password</label>
                    <input
                        type="password"
                        className="form-control"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        placeholder="Enter password"
                    />
                </div>
                <div className="form-group mb-2">
                    <label>Role</label>
                    <select
                        className="form-select"
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    >
                        <option value="factory_user">Factory User</option>
                        <option value="client">Client</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                <button className="btn btn-primary mt-2" onClick={handleAddUser}>Add User</button>
            </div>

            {/* Users Table */}
            <table className="table table-bordered mt-3">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Change Role</th>
                        <th>Change Password</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id}>
                            <td>{user.username}</td>
                            <td>{user.role}</td>
                            <td>
                                <select
                                    value={user.role}
                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                    className="form-select"
                                    disabled={loggedAdmin && loggedAdmin.id === user.id} // Prevent admin from changing their own role
                                >
                                    <option value="factory_user">Factory User</option>
                                    <option value="client">Client</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </td>
                            <td>
                                <div className="input-group">
                                    <input
                                        type="password"
                                        placeholder="New Password"
                                        className="form-control"
                                        value={passwordChanges[user.id] || ''}
                                        onChange={(e) => handlePasswordChangeInput(user.id, e.target.value)}
                                    />
                                    <button
                                        className="btn btn-success"
                                        onClick={() => handlePasswordSave(user.id)}
                                    >
                                        Save
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default AdminUserManagement;
