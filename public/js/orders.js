
document.addEventListener('DOMContentLoaded', () => {
  const cancelModal = new bootstrap.Modal(document.getElementById('cancelModal'));
  const returnModal = new bootstrap.Modal(document.getElementById('returnModal'));

  document.querySelectorAll('.btn-cancel-order').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-order');
      document.getElementById('cancelOrderId').value = id;
      cancelModal.show();
    });
  });

  document.querySelectorAll('.btn-return-order').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-order');
      document.getElementById('returnOrderId').value = id;
      document.getElementById('returnReason').value = '';
      returnModal.show();
    });
  });

  
  document.getElementById('cancelForm').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const orderId = document.getElementById('cancelOrderId').value;
    const reason = ev.target.reason.value;
    try {
      const res = await fetch(`/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (data.success) {
        location.reload();
      } else {
        alert(data.message || 'Cancel failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error cancelling order');
    }
  });


  document.getElementById('returnForm').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const orderId = document.getElementById('returnOrderId').value;
    const reason = ev.target.reason.value;
    if (!reason) {
      alert('Return reason required');
      return;
    }
    try {
      const res = await fetch(`/orders/${orderId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (data.success) {
        location.reload();
      } else {
        alert(data.message || 'Return failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error returning order');
    }
  });
});
