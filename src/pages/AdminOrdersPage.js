import React, { useState, useEffect } from 'react';
import ordersService from '../services/ordersService';

function AdminOrdersPage() {
    const [products, setProducts] = useState([]);
    const [order, setOrder] = useState({ productId: '', quantity: '', date_of_delivery: '', client: '' });
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const products = await ordersService.getProducts();
                setProducts(products);
            } catch (error) {
                setMessage('Error fetching products');
                setMessageType('danger');
                autoDismissMessage();
            }
        };
        fetchProducts();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await ordersService.createOrder(order);
            setMessage('Order created successfully');
            setMessageType('success');
            setOrder({ productId: '', quantity: '', date_of_delivery: '', client: '' });
            autoDismissMessage();
        } catch (error) {
            setMessage('Error creating order');
            setMessageType('danger');
            autoDismissMessage();
        }
    };

    const autoDismissMessage = () => {
        setTimeout(() => setMessage(''), 3000); // Clears message after 3 seconds
    };

    return (
        <div className="container mt-5">
            {message && (
                <div className={`alert alert-${messageType} alert-dismissible fade show`} role="alert">
                    {message}
                    <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
                </div>
            )}
            <h2>Submit a New Order</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Product</label>
                    <select
                        className="form-control"
                        value={order.productId}
                        onChange={(e) => setOrder({ ...order, productId: e.target.value })}
                        required
                    >
                        <option value="">Select a product</option>
                        {products.map((product) => (
                            <option key={product.id} value={product.id}>
                                {product.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="form-group mt-3">
                    <label>Quantity</label>
                    <input
                        type="number"
                        className="form-control"
                        value={order.quantity}
                        onChange={(e) => setOrder({ ...order, quantity: e.target.value })}
                        required
                    />
                </div>
                <div className="form-group mt-3">
                    <label>Date of Delivery</label>
                    <input
                        type="date"
                        className="form-control"
                        value={order.date_of_delivery}
                        onChange={(e) => setOrder({ ...order, date_of_delivery: e.target.value })}
                        required
                    />
                </div>
                <div className="form-group mt-3">
                    <label>Client</label>
                    <input
                        type="text"
                        className="form-control"
                        value={order.client}
                        onChange={(e) => setOrder({ ...order, client: e.target.value })}
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary mt-3">
                    Submit Order
                </button>
            </form>
        </div>
    );
}

export default AdminOrdersPage;
