import React, { useEffect, useState } from 'react';
import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL;

function AdminUserManagement() {
    const [users, setUsers] = useState([]);
    const [companies, setCompanies] = useState([]); // List of companies
    const [error, setError] = useState('');
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'factory_team', companyId: '' });
    const [passwordChanges, setPasswordChanges] = useState({});
    const [loggedAdmin, setLoggedAdmin] = useState(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchUsersAndCompanies = async () => {
            try {
                const token = localStorage.getItem('token');
                const decodedToken = JSON.parse(atob(token.split('.')[1]));
                setLoggedAdmin(decodedToken);

                // Fetch users
                const usersResponse = await axios.get(`${API_URL}/api/users`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUsers(usersResponse.data);

                // Fetch companies
                const companiesResponse = await axios.get(`${API_URL}/api/companies`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setCompanies(companiesResponse.data);
                
            } catch (error) {
                setError('Error fetching data. Only admins can access this page.');
                autoDismissMessage('error');
            }
        };

        fetchUsersAndCompanies();
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
        // Create a copy of the newUser object
        let userPayload = { ...newUser };
    
        // Remove companyId if the role is not 'client'
        if (userPayload.role !== 'client') {
            delete userPayload.companyId; // Remove the companyId field
        }
    
        console.log(userPayload); // Check the final payload
    
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_URL}/api/users/register`,
                userPayload, // Send the cleaned user payload
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setMessage('New user added successfully');
            setNewUser({ username: '', password: '', role: 'factory_team', companyId: '' });
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

                {/* Company selection for client role */}
                {newUser.role === 'client' && (
                    <div className="form-group mb-2">
                        <label>Company</label>
                        <select
                            className="form-select"
                            value={newUser.companyId}
                            onChange={(e) => setNewUser({ ...newUser, companyId: e.target.value })}
                            disabled={companies.length === 0} // Disable if no companies
                        >
                            {companies.length > 0 ? (
                                <>
                                    <option value="">Select a company</option>
                                    {companies.map((company) => (
                                        <option key={company.id} value={company.id}>{company.name}</option>
                                    ))}
                                </>
                            ) : (
                                <option value="">No companies available. Register a company first.</option>
                            )}
                        </select>
                    </div>
                )}
                <button
                    className="btn btn-primary mt-2"
                    onClick={handleAddUser}
                    disabled={newUser.role === 'client' && (!newUser.companyId || companies.length === 0)} // Disable if client and no company selected
                >
                    Add User
                </button>
            </div>

            {/* Users Table */}
            <table className="table table-bordered mt-3">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Company</th>
                        <th>Change Role</th>
                        <th>Change Password</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id}>
                            <td>{user.username}</td>
                            <td>{user.role}</td>
                            <td>{user.role === 'client' ? user.Company?.name || 'Not assigned' : 'All companies'}</td>
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
