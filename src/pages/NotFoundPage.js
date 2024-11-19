import React from 'react';
import { Link } from 'react-router-dom';

function NotFoundPage() {
    return (
        <div className="container text-center mt-5">
            <h1>404 - Page Not Found</h1>
            <p>The page you are looking for doesn't exist or has been moved.</p>
            <Link to="/logs" className="btn btn-primary mt-3">
                Go to Login
            </Link>
        </div>
    );
}

export default NotFoundPage;
