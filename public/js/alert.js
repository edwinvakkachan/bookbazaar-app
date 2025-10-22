function showPopupAlert(message, title = 'Notification') {
    document.getElementById('popupAlertTitle').innerText = title;
    document.getElementById('popupAlertMessage').innerText = message;
    const modalEl = document.getElementById('popupAlert');
    const modal = new bootstrap.Modal(modalEl, { backdrop: 'static' });
    modal.show();
  }