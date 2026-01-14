
function showConfirmModal(message = "Are you sure?", title = "Confirm") {
  return new Promise((resolve) => {
    const modalEl = document.getElementById("confirmModal");
    const modal = new bootstrap.Modal(modalEl, { backdrop: "static" });

    
    modalEl.querySelector(".modal-title").innerText = title;
    document.getElementById("confirmMessage").innerText = message;

    
    const yesBtn = document.getElementById("confirmYesBtn");
    const cancelBtn = document.getElementById("confirmCancelBtn");

   
    const newYesBtn = yesBtn.cloneNode(true);
    yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);

    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    
    newYesBtn.addEventListener("click", () => {
      modal.hide();
      resolve(true); 
    });

    
    newCancelBtn.addEventListener("click", () => {
      modal.hide();
      resolve(false); 
    });

    
    modalEl.addEventListener(
      "hidden.bs.modal",
      () => {
        resolve(false);
      },
      { once: true }
    );

    
    modal.show();
  });
}
