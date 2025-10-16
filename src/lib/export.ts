type ExportData = Record<string, any>[];

export const exportToCSV = (data: ExportData, filename: string) => {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        const stringValue = value !== null && value !== undefined ? String(value) : '';
        return `"${stringValue.replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const formatReservationForExport = (reservation: any) => {
  return {
    'Reservation ID': reservation.id,
    'Customer Name': reservation.customer_name,
    'Email': reservation.customer_email,
    'Phone': reservation.customer_phone,
    'Event': reservation.events?.name || 'N/A',
    'Event Date': reservation.events?.event_date ? new Date(reservation.events.event_date).toLocaleDateString() : 'N/A',
    'Venue': reservation.events?.venues?.name || 'N/A',
    'Reservation Type': reservation.reservation_type,
    'Party Size': reservation.party_size,
    'Status': reservation.status,
    'Occasion': reservation.occasion || 'N/A',
    'Special Requests': reservation.special_requests || 'N/A',
    'Total Amount': reservation.total_amount ? `$${reservation.total_amount}` : 'N/A',
    'Created At': new Date(reservation.created_at).toLocaleString(),
  };
};
