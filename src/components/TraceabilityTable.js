import React from 'react';
import moment from 'moment';

export default function TraceabilityTable({ logs, filteredLogs, isFiltered, userRole, onEdit }) {
  const list = isFiltered ? filteredLogs : logs;
  return (
    <table className="table table-bordered table-responsive-sm">
      <thead>
        <tr>
          <th>Date</th>
          <th>Product</th>
          <th>Lot Code</th>
          <th>Quantity</th>
          <th>Customer</th>
          <th className="d-none d-md-table-cell">Logged By</th>
          {userRole === 'admin' && <th>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {list.map(log => (
          <tr key={log.id}>
            <td>{moment.utc(log.date).format('MM/DD/YYYY')}</td>
            <td>{log.Product?.name}</td>
            <td>{log.lotCode}</td>
            <td>{log.quantity}</td>
            <td>{log.customer}</td>
            <td className="d-none d-md-table-cell">{log.logged_by}</td>
            {userRole === 'admin' && (
              <td>
                <button className="btn btn-warning btn-sm" onClick={() => onEdit(log)}>Edit</button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
