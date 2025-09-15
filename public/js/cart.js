// public/js/cart.js
(() => {
  'use strict';

  // --- Utilities ---
  const fmt = n => '₹' + (Number(n) || 0).toFixed(2);

  async function safeJson(res) {
    try { return await res.json(); } catch (e) { return null; }
  }

  // --- Core: quantity forms ---
  document.querySelectorAll('form[data-cart-qty]').forEach(form => {
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const productId = form.getAttribute('data-product-id');
      if (!productId) return console.warn('Missing productId on qty form');

      // build body based on hidden input 'action' or numeric input 'qty'
      const actionInput = form.querySelector('input[name="action"]');
      const qtyInput = form.querySelector('input[name="qty"]');

      const body = {};
      if (actionInput && actionInput.value) {
        body.action = actionInput.value; // 'inc' or 'dec'
      } else if (qtyInput) {
        // sanitize qty
        const val = qtyInput.value;
        const intQty = parseInt(val, 10);
        if (Number.isNaN(intQty) || intQty < 1) {
          alert('Please enter a valid quantity (1 or more).');
          return;
        }
        body.qty = intQty;
      } else {
        console.warn('No action or qty found in form', form);
        return;
      }

      try {
        const res = await fetch(form.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(body),
          credentials: 'same-origin'
        });

        const data = await safeJson(res);
        if (!res.ok) {
          const err = (data && data.error) || `Failed to update quantity (${res.status})`;
          throw new Error(err);
        }

        if (data && data.success && data.cart) {
          rebuildFromCartData(data.cart);
        } else {
          // fallback: try to update using returned item info or reload
          if (data && data.cart) rebuildFromCartData(data.cart);
          else window.location.reload();
        }
      } catch (err) {
        console.error('Quantity update error', err);
        alert(err.message || 'Could not update quantity');
      }
    });
  });

  // --- Remove handlers ---
  document.querySelectorAll('form[data-cart-remove]').forEach(form => {
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const productId = form.getAttribute('data-product-id');
      if (!productId) return console.warn('Missing productId on remove form');

      if (!confirm('Remove this item from cart?')) return;

      // Prefer a dedicated API remove endpoint; adjust candidates to your backend if needed
      const candidates = [
        `/api/cart/${productId}`,          // expects POST { remove: true } or DELETE
        `/api/cart/${productId}/remove`,
        `/cart/${productId}`,
        `/cart/delete/${productId}`
      ];

      let succeeded = false;
      for (const url of candidates) {
        try {
          // Try POST first with JSON indicating remove intent
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ remove: true }),
            credentials: 'same-origin'
          });

          // If 404/405, skip to next candidate
          if (res.status === 404 || res.status === 405) continue;

          const data = await safeJson(res);
          if (!res.ok) {
            const err = (data && data.error) || `Remove failed (${res.status})`;
            throw new Error(err);
          }

          if (data && data.success && data.cart) {
            rebuildFromCartData(data.cart);
            succeeded = true;
            break;
          } else if (data && data.success) {
            // server confirms success but didn't return cart -> remove DOM node and recalc
            removeItemCard(productId);
            succeeded = true;
            break;
          } else {
            // ambiguous: try delete method
            const del = await fetch(url, { method: 'DELETE', headers: { 'Accept': 'application/json' }, credentials: 'same-origin' });
            if (del.ok) {
              const ddata = await safeJson(del);
              if (ddata && ddata.cart) rebuildFromCartData(ddata.cart);
              else removeItemCard(productId);
              succeeded = true;
              break;
            } else continue;
          }
        } catch (e) {
          console.warn('Remove attempt failed for', url, e);
          continue;
        }
      }

      if (!succeeded) {
        if (confirm('AJAX remove failed. Submit form normally (page will reload)?')) {
          form.submit();
        }
      }
    });
  });

  // --- DOM helpers ---
  function removeItemCard(productId) {
    const el = document.querySelector(`[data-cart-item][data-product-id="${productId}"]`);
    if (el) el.remove();
    recalcTotalsFromDOM();
  }

  function recalcTotalsFromDOM() {
    let subtotal = 0;
    document.querySelectorAll('[data-cart-item]').forEach(card => {
      const qtyInput = card.querySelector('input[name="qty"]');
      const qty = qtyInput ? Number(qtyInput.value || 0) : 0;

      // parse price from card text (expects "₹###.##" somewhere)
      const txt = Array.from(card.querySelectorAll('*')).map(n => n.textContent || '').join(' ');
      const m = txt.match(/₹\s*([0-9,]+(\.[0-9]{1,2})?)/);
      let price = 0;
      if (m) price = Number(m[1].replace(/,/g, ''));
      subtotal += price * qty;
    });

    updateTotalsOnPage(subtotal);
  }

  function updateTotalsOnPage(subtotal) {
    const subEl = document.getElementById('cart-subtotal');
    const totEl = document.getElementById('cart-total');
    const pageTotEl = document.getElementById('cart-page-total');
    if (subEl) subEl.textContent = fmt(subtotal);
    if (totEl) totEl.textContent = fmt(subtotal);
    if (pageTotEl) pageTotEl.textContent = fmt(subtotal);
  }

  // Expected server cart shape: { items: [{ product: { _id, ... }, qty, priceAtAdd }, ... ] }
  function rebuildFromCartData(cart) {
    if (!cart || !Array.isArray(cart.items)) {
      recalcTotalsFromDOM();
      return;
    }

    // map by product id
    const map = {};
    cart.items.forEach(it => {
      const pid = it.product ? (it.product._id || String(it.product)) : (it.productId || '');
      if (pid) map[pid] = it;
    });

    // update or remove DOM nodes
    document.querySelectorAll('[data-cart-item]').forEach(card => {
      const pid = card.getAttribute('data-product-id');
      const item = map[pid];

      if (!item) {
        // remove card not present in server cart
        card.remove();
        return;
      }

      // update qty input
      const qtyInput = card.querySelector('input[name="qty"]');
      if (qtyInput) qtyInput.value = Number(item.qty || 0);

      // update price display (if present). Try to find element that has "Price" text
      const priceTextNode = Array.from(card.querySelectorAll('*')).find(el => /Price\s*₹?/i.test(el.textContent || ''));
      const price = Number(item.priceAtAdd || (item.product && (item.product.price || item.product.salePrice)) || 0);
      if (priceTextNode) priceTextNode.textContent = 'Price ' + fmt(price);
    });

    // recalc totals from server data
    let subtotal = 0;
    cart.items.forEach(it => {
      const price = Number(it.priceAtAdd || (it.product && (it.product.price || 0)) || 0);
      const q = Number(it.qty || 0);
      subtotal += price * q;
    });

    updateTotalsOnPage(subtotal);
  }

  // --- initialize: if the server provided cart as a JS variable (optional) we could rebuild here ---
  // (no-op; we update only after interactions)

})();
