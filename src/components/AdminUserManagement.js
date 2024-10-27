import React, { useEffect, useState } from 'react';
import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL;

function AdminUserManagement() {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'factory_team' });
    const [passwordChanges, setPasswordChanges] = useState({});
    const [loggedAdmin, setLoggedAdmin] = useState(null);
    const [message, setMessage] = useState('');

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
                console.log(users);
                
            } catch (error) {
                setError('Error fetching users. Only admins can access this page.');
                autoDismissMessage('error');
            }
        };

        fetchUsers();
    }, []);

    const handleRoleChange = async (userId, newRole) => {
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
            setMessage("Role successfully updated");
            autoDismissMessage('success');
        } catch (error) {
            setError('Failed to update role.');
            autoDismissMessage('error');
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
            setMessage('Password updated successfully');
            setPasswordChanges({ ...passwordChanges, [userId]: '' });
            autoDismissMessage('success');
        } catch (error) {
            setError('Failed to update password.');
            autoDismissMessage('error');
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
            setMessage('New user added successfully');
            setNewUser({ username: '', password: '', role: 'factory_team' });
            const response = await axios.get(`${API_URL}/api/users`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(response.data);
            autoDismissMessage('success');
        } catch (error) {
            setError('Failed to add user.');
            autoDismissMessage('error');
        }
    };

    const autoDismissMessage = (type) => {
        setTimeout(() => {
            if (type === 'success') setMessage('');
            if (type === 'error') setError('');
        }, 3000);
    };

    return (
        <div className='container mt-5'>
            {/* Success/Error Message Display */}
            <div className="fixed-top mt-5 d-flex justify-content-center">
                {message && (
                    <div className="alert alert-success alert-dismissible fade show w-75" role="alert">
                        {message}
                        <button type="button" className="btn-close" aria-label="Close" onClick={() => setMessage('')}></button>
                    </div>
                )}
                {error && (
                    <div className="alert alert-danger alert-dismissible fade show w-75" role="alert">
                        {error}
                        <button type="button" className="btn-close" aria-label="Close" onClick={() => setError('')}></button>
                    </div>
                )}
            </div>

            <h2>Admin User Management</h2>

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
                        <option value="factory_team">Factory User</option>
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
                                    disabled={loggedAdmin && loggedAdmin.id === user.id}
                                >
                                    <option value="factory_team">Factory User</option>
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
