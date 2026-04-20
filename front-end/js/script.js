/* ── NAVBAR SCROLL ── */
const nav = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
});

/* ══════════════════════════════════════════
   SCROLL REVEAL — efeito surgindo
══════════════════════════════════════════ */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

function initReveal() {
  document.querySelectorAll('.reveal').forEach((el) => {
    revealObserver.observe(el);
  });
}

/* ══════════════════════════════════════════
   CARRINHO — estado global
══════════════════════════════════════════ */
let cart = JSON.parse(localStorage.getItem('sol_cart') || '[]');

function saveCart() {
  localStorage.setItem('sol_cart', JSON.stringify(cart));
  updateCartUI();
}

function addToCart(name, price, img) {
  const existing = cart.find(i => i.name === name);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ name, price, img, qty: 1 });
  }
  saveCart();
  showCartToast(name);
}

function removeFromCart(name) {
  cart = cart.filter(i => i.name !== name);
  saveCart();
  renderCartItems();
}

function changeQty(name, delta) {
  const item = cart.find(i => i.name === name);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(name);
  else { saveCart(); renderCartItems(); }
}

/* ✅ CORREÇÃO: Parse de preço corrigido */
function parsePreco(str) {
  if (!str) return 0;
  // Remove "R$", pontos de milhar, mantém vírgula, substitui por ponto
  const cleaned = str.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

function cartTotal() {
  return cart.reduce((sum, i) => {
    const val = parsePreco(i.price);
    return sum + val * i.qty;
  }, 0);
}

function updateCartUI() {
  const badge = document.getElementById('cart-badge');
  const total = cart.reduce((s, i) => s + i.qty, 0);
  if (badge) {
    badge.textContent = total;
    badge.style.display = total > 0 ? 'flex' : 'none';
  }
}

function showCartToast(name) {
  let toast = document.getElementById('cart-toast');
  if (!toast) return;
  toast.textContent = `"${name}" adicionado ao carrinho`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

function renderCartItems() {
  const container = document.getElementById('cart-items-list');
  const totalEl = document.getElementById('cart-total-val');
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `<div class="cart-empty">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 01-8 0"/>
      </svg>
      <p>Seu carrinho está vazio</p>
    </div>`;
  } else {
    container.innerHTML = cart.map(item => `
      <div class="cart-item">
        <img src="${item.img}" alt="${item.name}" class="cart-item-img"/>
        <div class="cart-item-info">
          <p class="cart-item-name">${item.name}</p>
          <p class="cart-item-price">${item.price}</p>
          <div class="cart-item-qty">
            <button onclick="changeQty('${item.name}', -1)">−</button>
            <span>${item.qty}</span>
            <button onclick="changeQty('${item.name}', 1)">+</button>
          </div>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart('${item.name}')">×</button>
      </div>
    `).join('');
  }

  if (totalEl) {
    totalEl.textContent = 'R$ ' + cartTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  }
}

function openCart() {
  closeSideMenu();
  const drawer = document.getElementById('cart-drawer');
  if (drawer) {
    drawer.classList.add('open');
    renderCartItems();
    document.body.style.overflow = 'hidden';
  }
}

function closeCart() {
  const drawer = document.getElementById('cart-drawer');
  if (drawer) {
    drawer.classList.remove('open');
    document.body.style.overflow = '';
  }
}

/* ══════════════════════════════════════════
   AUTENTICAÇÃO — login com Google / e-mail
══════════════════════════════════════════ */
let currentUser = JSON.parse(localStorage.getItem('sol_user') || 'null');

function saveUser(user) {
  currentUser = user;
  localStorage.setItem('sol_user', JSON.stringify(user));
  updateAuthUI();
}

function logout() {
  currentUser = null;
  localStorage.removeItem('sol_user');
  localStorage.removeItem('sol_jwt');
  updateAuthUI();
  closeProfile();
}

function updateAuthUI() {
  const loginBtn = document.getElementById('nav-login-btn');
  const profileBtn = document.getElementById('nav-profile-btn');
  if (!loginBtn || !profileBtn) return;

  if (currentUser) {
    loginBtn.style.display = 'none';
    profileBtn.style.display = 'flex';
    const avatar = profileBtn.querySelector('.profile-avatar');
    if (avatar) {
      if (currentUser.photo) {
        avatar.innerHTML = `<img src="${currentUser.photo}" alt="${currentUser.name}"/>`;
      } else {
        avatar.textContent = currentUser.name.charAt(0).toUpperCase();
      }
    }
  } else {
    loginBtn.style.display = 'flex';
    profileBtn.style.display = 'none';
  }
}

function openLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    clearLoginError();
  }
}

function clearLoginError() {
  const err = document.getElementById('login-error');
  if (err) err.textContent = '';
}

function handleEmailLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const name = email.split('@')[0].replace(/[._]/g, ' ');
  if (!email) return;
  saveUser({ name, email, photo: null, address: null });
  closeLoginModal();
  showProfileWelcome();
}

/* ── CONFIG ── */
const GOOGLE_CLIENT_ID = window.SOL_CONFIG?.GOOGLE_CLIENT_ID || 'SEU_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const API_URL = window.SOL_CONFIG?.API_ORIGIN || window.location.origin;

function loginWithGoogle() {
  if (typeof google === 'undefined') {
    showLoginError('SDK do Google não carregou. Verifique sua conexão.');
    return;
  }

  /* Usa oauth2 popup — mais confiável para desenvolvimento local */
  const client = google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: 'openid profile email',
    callback: async (tokenResponse) => {
      if (tokenResponse.error) {
        showLoginError('Erro ao autenticar com Google.');
        return;
      }
      try {
        /* Busca dados do perfil com o access_token */
        const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        const profile = await profileRes.json();

        /* Tenta salvar no back-end, mas funciona sem ele também */
        try {
          const res = await fetch(`${API_URL}/api/auth/google-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              googleId: profile.sub,
              email: profile.email,
              name: profile.name,
              photo: profile.picture
            })
          });
          if (res.ok) {
            const data = await res.json();
            localStorage.setItem('sol_jwt', data.token);
          }
        } catch (e) { /* back-end offline — continua só local */ }

        saveUser({ name: profile.name, email: profile.email, photo: profile.picture, address: null });
        closeLoginModal();
        showProfileWelcome();

      } catch (err) {
        showLoginError('Não foi possível obter os dados do perfil.');
      }
    }
  });

  client.requestAccessToken();
}

/* JWT header para chamadas autenticadas */
function authHeader() {
  const token = localStorage.getItem('sol_jwt');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

function showLoginError(msg) {
  const err = document.getElementById('login-error');
  if (err) err.textContent = msg;
}

function showProfileWelcome() {
  let toast = document.getElementById('cart-toast');
  if (!toast) return;
  toast.textContent = `Bem-vinda, ${currentUser.name.split(' ')[0]}! ☀️`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function openProfile() {
  closeSideMenu();
  const drawer = document.getElementById('profile-drawer');
  if (drawer) {
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
    renderProfile();
  }
}

function closeProfile() {
  const drawer = document.getElementById('profile-drawer');
  if (drawer) {
    drawer.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function renderProfile() {
  if (!currentUser) return;
  const nameEl = document.getElementById('profile-name');
  const emailEl = document.getElementById('profile-email');
  const addrEl = document.getElementById('profile-address-val');
  const avatarEl = document.getElementById('profile-avatar-big');

  if (nameEl) nameEl.textContent = currentUser.name;
  if (emailEl) emailEl.textContent = currentUser.email;
  if (addrEl) addrEl.textContent = currentUser.address || 'Nenhum endereço salvo';
  if (avatarEl) {
    if (currentUser.photo) {
      avatarEl.innerHTML = `<img src="${currentUser.photo}" alt="${currentUser.name}"/>`;
    } else {
      avatarEl.textContent = currentUser.name.charAt(0).toUpperCase();
    }
  }
}

async function saveAddress() {
  const input = document.getElementById('profile-address-input');
  if (!input || !currentUser) return;
  const addr = input.value.trim();
  if (!addr) return;

  try {
    const response = await fetch(`${API_URL}/api/auth/address`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader()
      },
      body: JSON.stringify({ address: addr })
    });

    if (!response.ok && localStorage.getItem('sol_jwt')) {
      throw new Error('Falha ao salvar endereço');
    }
  } catch (_err) {
    showCartToast('Não foi possível salvar no servidor. Endereço salvo só neste navegador.');
  }

  currentUser.address = addr;
  saveUser(currentUser);
  renderProfile();
  input.value = '';
  const addrSection = document.getElementById('address-edit');
  if (addrSection) addrSection.style.display = 'none';
}

function toggleAddressEdit() {
  const section = document.getElementById('address-edit');
  if (section) {
    section.style.display = section.style.display === 'none' ? 'block' : 'none';
  }
}

/* ══════════════════════════════════════════
   INJETAR HTML GLOBAL (navbar + drawers)
══════════════════════════════════════════ */
function injectGlobalUI() {
  /* Cart drawer */
  const cartDrawer = document.createElement('div');
  cartDrawer.innerHTML = `
    <div id="cart-drawer" class="side-drawer">
      <div class="drawer-header">
        <h3 class="drawer-title">Carrinho</h3>
        <button class="drawer-close" onclick="closeCart()">×</button>
      </div>
      <div id="cart-items-list" class="cart-items"></div>
      <div class="cart-footer">
        <div class="cart-total">
          <span>Total</span>
          <span id="cart-total-val">R$ 0,00</span>
        </div>
        <a href="pagamento.html" class="cart-checkout-btn" onclick="closeCart()">
          Finalizar Compra
        </a>
      </div>
    </div>
    <div class="drawer-overlay" id="cart-overlay" onclick="closeCart()"></div>
  `;
  document.body.appendChild(cartDrawer);

  /* Profile drawer */
  const profileDrawer = document.createElement('div');
  profileDrawer.innerHTML = `
    <div id="profile-drawer" class="side-drawer side-drawer--right">
      <div class="drawer-header">
        <h3 class="drawer-title">Meu Perfil</h3>
        <button class="drawer-close" onclick="closeProfile()">×</button>
      </div>
      <div class="profile-content">
        <div class="profile-avatar-wrap">
          <div class="profile-avatar-big" id="profile-avatar-big"></div>
        </div>
        <div class="profile-info">
          <p class="profile-field-label">Nome</p>
          <p class="profile-field-val" id="profile-name"></p>
          <p class="profile-field-label">E-mail</p>
          <p class="profile-field-val" id="profile-email"></p>
          <p class="profile-field-label">Endereço de entrega</p>
          <p class="profile-field-val" id="profile-address-val"></p>
          <button class="profile-edit-btn" onclick="toggleAddressEdit()">Editar endereço</button>
          <div id="address-edit" style="display:none; margin-top:1rem;">
            <input id="profile-address-input" class="profile-input" type="text" placeholder="Rua, número, bairro, cidade..."/>
            <button class="profile-save-btn" onclick="saveAddress()">Salvar</button>
          </div>
        </div>
        <button class="logout-btn" onclick="logout()">Sair da conta</button>
      </div>
    </div>
    <div class="drawer-overlay" id="profile-overlay" onclick="closeProfile()"></div>
  `;
  document.body.appendChild(profileDrawer);

  /* Login modal */
  const loginModal = document.createElement('div');
  loginModal.innerHTML = `
    <div id="login-modal" class="modal-overlay" onclick="handleModalOverlayClick(event)">
      <div class="modal-box">
        <button class="modal-close" onclick="closeLoginModal()">×</button>
        <div class="modal-logo">SOL</div>
        <p class="modal-subtitle">Entre na sua conta</p>
        <button class="google-btn" onclick="loginWithGoogle()">
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Entrar com Google
        </button>
        <div id="google-btn-container" style="display:none"></div>
        <div class="modal-divider"><span>ou</span></div>
        <form onsubmit="handleEmailLogin(event)" class="modal-form">
          <input id="login-email" type="email" placeholder="Seu e-mail" class="modal-input" required/>
          <p id="login-error" class="login-error"></p>
          <button type="submit" class="modal-submit">Entrar</button>
        </form>
        <p class="modal-note">Ao entrar, seu endereço pode ser salvo para facilitar suas compras.</p>
      </div>
    </div>
  `;
  document.body.appendChild(loginModal);

  /* Menu lateral do site */
  const siteMenu = document.createElement('div');
  siteMenu.innerHTML = `
    <div id="site-menu-drawer" class="side-drawer site-menu-drawer">
      <div class="drawer-header">
        <h3 class="drawer-title">Navegação</h3>
        <button class="drawer-close" onclick="closeSideMenu()">×</button>
      </div>
      <nav class="site-menu-nav">
        <a href="index.html" class="site-menu-link" onclick="closeSideMenu()">
          <span class="site-menu-eyebrow">Voltar</span>
          <strong>Início do site</strong>
        </a>
        <a href="biquinis.html" class="site-menu-link" onclick="closeSideMenu()">
          <span class="site-menu-eyebrow">Coleção</span>
          <strong>Página Biquínis</strong>
        </a>
        <a href="maio.html" class="site-menu-link" onclick="closeSideMenu()">
          <span class="site-menu-eyebrow">Coleção</span>
          <strong>Página Maiô</strong>
        </a>
        <a href="maisvendidos.html" class="site-menu-link" onclick="closeSideMenu()">
          <span class="site-menu-eyebrow">Destaque</span>
          <strong>Mais vendidos</strong>
        </a>
      </nav>
    </div>
    <div class="drawer-overlay" id="site-menu-overlay" onclick="closeSideMenu()"></div>
  `;
  document.body.appendChild(siteMenu);

  /* Toast */
  const toast = document.createElement('div');
  toast.id = 'cart-toast';
  toast.className = 'cart-toast';
  document.body.appendChild(toast);

  /* Sincronizar overlay dos drawers */
  document.getElementById('profile-overlay').addEventListener('click', closeProfile);
}

function handleModalOverlayClick(e) {
  if (e.target.id === 'login-modal') closeLoginModal();
}

function openSideMenu() {
  closeCart();
  closeProfile();
  const drawer = document.getElementById('site-menu-drawer');
  if (drawer) {
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeSideMenu() {
  const drawer = document.getElementById('site-menu-drawer');
  if (drawer) {
    drawer.classList.remove('open');
    document.body.style.overflow = '';
  }
}

/* ── Selecionar tamanho nos cards de produto ── */
function selecionarTamanho(btn) {
  const grupo = btn.closest('.painel-tamanhos');
  grupo.querySelectorAll('.tam-btn').forEach(b => b.classList.remove('ativo'));
  btn.classList.add('ativo');
}

/* ══════════════════════════════════════════
   CHECKOUT — Modal de pagamento
══════════════════════════════════════════ */
function openCheckout() {
  if (cart.length === 0) {
    showCartToast('Adicione itens ao carrinho primeiro!');
    return;
  }

  if (!currentUser) {
    closeCart();
    openLoginModal();
    showCartToast('Faça login para finalizar a compra');
    return;
  }

  closeCart();
  
  const modal = document.getElementById('checkout-modal');
  if (!modal) {
    injectCheckoutModal();
  }
  
  setTimeout(() => {
    document.getElementById('checkout-modal').classList.add('aberto');
    document.body.style.overflow = 'hidden';
    renderCheckoutSummary();
  }, 100);
}

function closeCheckout() {
  const modal = document.getElementById('checkout-modal');
  if (modal) {
    modal.classList.remove('aberto');
    document.body.style.overflow = '';
  }
}

function renderCheckoutSummary() {
  const container = document.getElementById('checkout-items');
  const totalEl = document.getElementById('checkout-total');
  
  if (!container) return;

  container.innerHTML = cart.map(item => `
    <div class="checkout-item">
      <img src="${item.img}" alt="${item.name}" class="checkout-item-img"/>
      <div class="checkout-item-info">
        <p class="checkout-item-name">${item.name}</p>
        <p class="checkout-item-qty">Qtd: ${item.qty}</p>
      </div>
      <p class="checkout-item-price">${item.price}</p>
    </div>
  `).join('');

  totalEl.textContent = 'R$ ' + cartTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function selecionarPagamento(method) {
  document.querySelectorAll('.pagamento-option').forEach(opt => {
    opt.classList.remove('selected');
  });
  
  const selected = document.querySelector(`.pagamento-option[data-method="${method}"]`);
  if (selected) {
    selected.classList.add('selected');
  }
  
  document.getElementById('checkout-btn').disabled = false;
}

function finalizarPagamento() {
  const selected = document.querySelector('.pagamento-option.selected');
  if (!selected) {
    showCartToast('Selecione uma forma de pagamento');
    return;
  }

  const method = selected.dataset.method;
  const btn = document.getElementById('checkout-btn');
  btn.disabled = true;
  btn.textContent = 'Processando...';

  if (method === 'whatsapp') {
    enviarPedidoWhatsApp();
  } else {
    processarPagamentoOnline(method);
  }
}

function processarPagamentoOnline(method) {
  const methodNames = {
    'debito': 'Débito',
    'credito': 'Crédito',
    'pix': 'PIX'
  };

  const pedido = {
    items: cart,
    total: 'R$ ' + cartTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
    paymentMethod: method,
    customerName: currentUser.name,
    customerEmail: currentUser.email,
    customerAddress: currentUser.address || 'Não informado'
  };

  fetch(`${API_URL}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader()
    },
    body: JSON.stringify(pedido)
  })
  .then(res => {
    if (!res.ok) throw new Error('Erro ao processar pedido');
    return res.json();
  })
  .then(order => {
    closeCheckout();

    if (method === 'pix') {
      mostrarConfirmacaoPIX(order);
    } else {
      mostrarConfirmacaoPagamento(order, methodNames[method]);
    }

    cart = [];
    saveCart();
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.disabled = false;
      checkoutBtn.textContent = 'Finalizar Pedido';
    }
  })
  .catch(err => {
    console.error(err);
    showCartToast('Erro ao processar pagamento. Tente novamente.');
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.disabled = false;
      checkoutBtn.textContent = 'Finalizar Pedido';
    }
  });
}

function mostrarConfirmacaoPagamento(order, method) {
  const toast = document.getElementById('cart-toast');
  toast.innerHTML = `
    <div style="text-align:center">
      <p style="margin-bottom:0.5rem">✅ Pedido #${order.id.slice(-6)} confirmado!</p>
      <p style="font-size:0.75rem;opacity:0.8">Pagamento: ${method}</p>
    </div>
  `;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
    toast.innerHTML = '';
  }, 4000);
}

function mostrarConfirmacaoPIX(order) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay aberto';
  modal.id = 'pix-modal';
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  
  const pixKey = window.SOL_CONFIG?.PIX_KEY || 'SUA_CHAVE_PIX';
  const pixCode = `00020126580014br.gov.bcb.pix0136${pixKey}5204000053039865406${cartTotal().toFixed(2).replace('.',',')}5802BR5913SOL MODA PRAIA6009SAO PAULO62070503***6304`;
  
  modal.innerHTML = `
    <div class="modal-box" style="max-width:420px;text-align:center">
      <button class="modal-close" onclick="document.getElementById('pix-modal').remove()">×</button>
      <h3 style="font-family:'Cormorant Garamond',serif;font-weight:300;font-size:1.6rem;margin-bottom:1rem;color:#2a2a2a">Pagamento via PIX</h3>
      <p style="font-family:'Cinzel',serif;font-size:0.6rem;letter-spacing:0.2em;text-transform:uppercase;color:#9a9490;margin-bottom:1.5rem">Pedido #${order.id.slice(-6)}</p>
      
      <div style="background:#F7F3EE;padding:1.5rem;margin:1.5rem 0">
        <p style="font-size:0.85rem;margin-bottom:0.5rem;color:#2a2a2a">Valor: <strong style="color:#C9A96E">${'R$ ' + cartTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></p>
        <div style="background:#fff;padding:1rem;margin:1rem 0;border:1px solid #EDE8E2">
          <p style="font-size:0.7rem;color:#9a9490;margin-bottom:0.5rem">Código PIX (copia e cola)</p>
          <p style="font-size:0.65rem;word-break:break-all;color:#2a2a2a;font-family:monospace" id="pix-code">${pixCode}</p>
        </div>
        <button class="btn-primary" onclick="copiarPIX()" style="width:100%;margin-top:0.5rem">
          Copiar código PIX
        </button>
      </div>
      
      <p style="font-size:0.75rem;color:#9a9490;font-style:italic">
        Após o pagamento, envie o comprovante pelo WhatsApp para confirmação.
      </p>
      
      <a href="https://wa.me/${window.SOL_CONFIG?.WHATSAPP_PHONE || '5511999999999'}?text=Olá! Fiz o pagamento do pedido #${order.id.slice(-6)} via PIX. Segue o comprovante:" 
         target="_blank"
         class="btn-primary" 
         style="display:inline-block;margin-top:1rem;text-decoration:none">
        Enviar comprovante
      </a>
    </div>
  `;
  
  document.body.appendChild(modal);
  closeCheckout();
}

function copiarPIX() {
  const code = document.getElementById('pix-code').textContent;
  navigator.clipboard.writeText(code).then(() => {
    showCartToast('Código PIX copiado!');
  }).catch(() => {
    showCartToast('Erro ao copiar. Selecione e copie manualmente.');
  });
}

function enviarPedidoWhatsApp() {
  const items = cart.map(item => `• ${item.name} (x${item.qty}) - ${item.price}`).join('%0A');
  const total = 'R$ ' + cartTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const endereco = currentUser.address || 'Não informado';
  
  const mensagem = `🛍️ *NOVO PEDIDO - SOL MODA PRAIA*%0A%0A` +
    `👤 *Cliente:* ${currentUser.name}%0A` +
    `📧 *Email:* ${currentUser.email}%0A` +
    `📍 *Endereço:* ${endereco}%0A%0A` +
    `📦 *Itens:*%0A${items}%0A%0A` +
    `💰 *Total:* ${total}%0A%0A` +
    `💳 *Pagamento:* A combinar`;
  
  const phone = window.SOL_CONFIG?.WHATSAPP_PHONE || '5511999999999';
  const url = `https://wa.me/${phone}?text=${mensagem}`;
  
  window.open(url, '_blank');
  
  closeCheckout();
  
  const pedido = {
    items: cart,
    total: total,
    paymentMethod: 'whatsapp',
    customerName: currentUser.name,
    customerEmail: currentUser.email,
    customerAddress: endereco
  };
  
  fetch(`${API_URL}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader()
    },
    body: JSON.stringify(pedido)
  }).then(() => {
    cart = [];
    saveCart();
    showCartToast('Pedido enviado! Finalize no WhatsApp');
  }).catch(err => {
    console.error(err);
    showCartToast('Pedido registrado localmente');
  });
}

function injectCheckoutModal() {
  const modal = document.createElement('div');
  modal.id = 'checkout-modal';
  modal.className = 'modal-overlay';
  modal.onclick = (e) => { if (e.target === modal) closeCheckout(); };
  
  modal.innerHTML = `
    <div class="modal-box" style="max-width:600px">
      <button class="modal-close" onclick="closeCheckout()">×</button>
      <h3 style="font-family:'Cormorant Garamond',serif;font-weight:300;font-size:1.6rem;margin-bottom:0.5rem;color:#2a2a2a">Finalizar Pedido</h3>
      <p style="font-family:'Cinzel',serif;font-size:0.6rem;letter-spacing:0.2em;text-transform:uppercase;color:#9a9490;margin-bottom:2rem">Escolha como deseja pagar</p>
      
      <div id="checkout-items" style="max-height:200px;overflow-y:auto;margin-bottom:1.5rem;padding-bottom:1.5rem;border-bottom:1px solid rgba(201,169,110,0.2)"></div>
      
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2rem;padding:1rem;background:#fff">
        <span style="font-family:'Cinzel',serif;font-size:0.65rem;letter-spacing:0.18em;text-transform:uppercase;color:#9a9490">Total</span>
        <span id="checkout-total" style="font-family:'Cinzel',serif;font-size:1.1rem;letter-spacing:0.1em;color:#C9A96E">R$ 0,00</span>
      </div>
      
      <p style="font-family:'Cinzel',serif;font-size:0.6rem;letter-spacing:0.2em;text-transform:uppercase;color:#9a9490;margin-bottom:1rem">Forma de pagamento</p>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:2rem">
        <button class="pagamento-option" data-method="credito" onclick="selecionarPagamento('credito')">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="1" y="4" width="22" height="16" rx="2"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
          <span>Crédito</span>
          <small>Até 12x</small>
        </button>
        
        <button class="pagamento-option" data-method="debito" onclick="selecionarPagamento('debito')">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="1" y="4" width="22" height="16" rx="2"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
          <span>Débito</span>
          <small>À vista</small>
        </button>
        
        ${window.SOL_CONFIG?.ENABLE_MANUAL_PIX ? `
        <button class="pagamento-option" data-method="pix" onclick="selecionarPagamento('pix')">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
          <span>PIX</span>
          <small>5% desconto</small>
        </button>
        ` : ''}
        
        ${window.SOL_CONFIG?.ENABLE_WHATSAPP_CHECKOUT ? `
        <button class="pagamento-option" data-method="whatsapp" onclick="selecionarPagamento('whatsapp')">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          <span>WhatsApp</span>
          <small>Combinar</small>
        </button>
        ` : ''}
      </div>
      
      <button class="btn-primary" id="checkout-btn" onclick="finalizarPagamento()" disabled style="width:100%">
        Finalizar Pedido
      </button>
    </div>
  `;
  
  document.body.appendChild(modal);
}

/* ══════════════════════════════════════════
   MODAL DE PRODUTO
══════════════════════════════════════════ */
function injectModal() {
  if (!document.querySelector('.produtos-grid')) return;

  const el = document.createElement('div');
  el.innerHTML = `
    <div class="produto-modal-overlay" id="produto-modal-overlay" onclick="handleModalClick(event)">
      <button class="modal-produto-seta modal-produto-prev" id="modal-produto-prev" onclick="navegarProduto(-1)">&#8592;</button>
      <div class="produto-modal" id="produto-modal">
        <button class="modal-fechar" onclick="fecharModal()">×</button>
        <div class="modal-foto-wrap">
          <img class="modal-foto" id="modal-foto" src="" alt=""/>
          <button class="modal-seta modal-seta-prev" id="modal-seta-prev" onclick="modalNavegar(-1)">&#8592;</button>
          <button class="modal-seta modal-seta-next" id="modal-seta-next" onclick="modalNavegar(1)">&#8594;</button>
          <div class="modal-dots" id="modal-dots"></div>
        </div>
        <div class="modal-corpo">
          <span class="modal-badge">Verão 2026</span>
          <h2 class="modal-nome" id="modal-nome"></h2>
          <div class="modal-divider"></div>
          <p class="modal-preco" id="modal-preco"></p>
          <div>
            <p class="modal-label">Tamanho</p>
            <div class="modal-tamanhos" id="modal-tamanhos">
              <button class="modal-tam-btn" onclick="selecionarModalTam(this)">P</button>
              <button class="modal-tam-btn" onclick="selecionarModalTam(this)">M</button>
              <button class="modal-tam-btn" onclick="selecionarModalTam(this)">G</button>
              <button class="modal-tam-btn" onclick="selecionarModalTam(this)">GG</button>
            </div>
            <p class="modal-aviso" id="modal-aviso">Selecione um tamanho</p>
          </div>
          <p class="modal-desc" id="modal-desc"></p>
          <button class="modal-btn-carrinho" id="modal-btn-carrinho">Adicionar ao Carrinho</button>
          <button class="modal-proximo-btn" onclick="navegarProduto(1)">Próximo produto</button>
        </div>
      </div>
      <button class="modal-produto-seta modal-produto-next" id="modal-produto-next" onclick="navegarProduto(1)">&#8594;</button>
    </div>
  `;
  document.body.appendChild(el);
}

let _modalFotos = [];
let _modalIdx = 0;
let _modalCards = [];
let _modalCardIdx = 0;

function isMobileViewport() {
  return window.innerWidth <= 640;
}

function bindHorizontalSwipe(element, onPrev, onNext) {
  if (!element || element.dataset.swipeBound === 'true') return;

  let startX = 0;
  let startY = 0;
  let deltaX = 0;
  let deltaY = 0;

  element.dataset.swipeBound = 'true';

  element.addEventListener('touchstart', (event) => {
    if (!isMobileViewport() || !event.touches[0]) return;
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
    deltaX = 0;
    deltaY = 0;
  }, { passive: true });

  element.addEventListener('touchmove', (event) => {
    if (!isMobileViewport() || !event.touches[0]) return;
    deltaX = event.touches[0].clientX - startX;
    deltaY = event.touches[0].clientY - startY;
  }, { passive: true });

  element.addEventListener('touchend', () => {
    if (!isMobileViewport()) return;

    const horizontal = Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2;
    if (!horizontal) return;

    if (deltaX < 0) onNext();
    else onPrev();
  });
}

function abrirModal(nome, preco, imgSrc, card) {
  _modalCards = Array.from(document.querySelectorAll('.produto-card'));
  _modalCardIdx = _modalCards.indexOf(card);

  _carregarProdutoNoModal(card, imgSrc);

  document.getElementById('produto-modal-overlay').classList.add('aberto');
  document.body.style.overflow = 'hidden';
}

function _carregarProdutoNoModal(card, imgAtiva) {
  _modalFotos = [];
  _modalIdx = 0;

  if (card) {
    const slides = card.querySelectorAll('.produto-slide img');
    slides.forEach(img => {
      const src = img.getAttribute('src');
      if (src && src !== 'sua img aqui') _modalFotos.push(src);
    });
  }

  if (_modalFotos.length === 0) {
    const fallback = card?.querySelector('img')?.getAttribute('src') || '';
    if (fallback) _modalFotos = [fallback];
  }

  if (imgAtiva) {
    const idx = _modalFotos.indexOf(imgAtiva);
    _modalIdx = idx >= 0 ? idx : 0;
  }

  _modalRenderFoto();

  const nome = card?.querySelector('.produto-nome')?.textContent || '';
  const preco = card?.querySelector('.produto-preco')?.textContent || '';

  document.getElementById('modal-nome').textContent = nome;
  document.getElementById('modal-preco').textContent = preco;
  document.getElementById('modal-desc').textContent = card?.dataset?.descricao || 'Peça exclusiva da coleção Sol Verão 2026. Tecido de alta qualidade, corte que valoriza e acabamento premium para você brilhar em qualquer praia.';
  document.getElementById('modal-aviso').classList.remove('visivel');
  document.querySelectorAll('.modal-tam-btn').forEach(b => b.classList.remove('ativo'));

  document.getElementById('modal-btn-carrinho').onclick = () => {
    const tamAtivo = document.querySelector('.modal-tam-btn.ativo');
    if (!tamAtivo) {
      document.getElementById('modal-aviso').classList.add('visivel');
      return;
    }
    addToCart(`${nome} (${tamAtivo.textContent})`, preco, _modalFotos[_modalIdx]);
    fecharModal();
  };
}

function navegarProduto(dir) {
  _modalCardIdx = (_modalCardIdx + dir + _modalCards.length) % _modalCards.length;
  _carregarProdutoNoModal(_modalCards[_modalCardIdx], null);
}

function _modalRenderFoto() {
  const foto = document.getElementById('modal-foto');
  const prevBtn = document.getElementById('modal-seta-prev');
  const nextBtn = document.getElementById('modal-seta-next');
  const dotsEl = document.getElementById('modal-dots');

  foto.src = _modalFotos[_modalIdx];

  const mostrar = _modalFotos.length > 1;
  const exibirSetas = mostrar && !isMobileViewport();
  prevBtn.style.display = exibirSetas ? 'flex' : 'none';
  nextBtn.style.display = exibirSetas ? 'flex' : 'none';

  dotsEl.innerHTML = _modalFotos.map((_, i) =>
    `<span class="modal-dot-item${i === _modalIdx ? ' ativo' : ''}"></span>`
  ).join('');
}

function modalNavegar(dir) {
  _modalIdx = (_modalIdx + dir + _modalFotos.length) % _modalFotos.length;
  _modalRenderFoto();
}

function fecharModal() {
  document.getElementById('produto-modal-overlay').classList.remove('aberto');
  document.body.style.overflow = '';
}

function handleModalClick(e) {
  if (e.target.id === 'produto-modal-overlay') fecharModal();
}

function selecionarModalTam(btn) {
  document.querySelectorAll('.modal-tam-btn').forEach(b => b.classList.remove('ativo'));
  btn.classList.add('ativo');
  document.getElementById('modal-aviso').classList.remove('visivel');
}

/* ── Carrossel de fotos nos cards ── */
function initCarrosseis() {
  document.querySelectorAll('.produto-slides').forEach(slides => {
    const itens = slides.querySelectorAll('.produto-slide');
    if (itens.length <= 1) return;

    let atual = 0;

    const dots = slides.querySelectorAll('.slide-dot');
    const prevBtn = slides.querySelector('.slide-btn-prev');
    const nextBtn = slides.querySelector('.slide-btn-next');

    function irPara(idx) {
      itens[atual].classList.remove('ativo');
      dots[atual]?.classList.remove('ativo');
      atual = (idx + itens.length) % itens.length;
      itens[atual].classList.add('ativo');
      dots[atual]?.classList.add('ativo');
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        irPara(atual - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        irPara(atual + 1);
      });
    }

    dots.forEach((dot, i) => {
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        irPara(i);
      });
    });

    bindHorizontalSwipe(
      slides,
      () => irPara(atual - 1),
      () => irPara(atual + 1)
    );
  });

  const modalFotoWrap = document.querySelector('.modal-foto-wrap');
  bindHorizontalSwipe(
    modalFotoWrap,
    () => {
      if (_modalFotos.length > 1) modalNavegar(-1);
    },
    () => {
      if (_modalFotos.length > 1) modalNavegar(1);
    }
  );
}

/* ── Botões de comprar nas páginas de produto ── */
function normalizeSearchText(text) {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function filterProductCards(query) {
  const normalizedQuery = normalizeSearchText(query);
  const cards = document.querySelectorAll('.produto-card');
  const emptyState = document.getElementById('produto-search-empty');
  const clearBtn = document.getElementById('produto-search-clear');
  const countLabel = document.getElementById('produto-search-count');
  let visibleCount = 0;

  cards.forEach((card) => {
    const nome = card.querySelector('.produto-nome')?.textContent || '';
    const preco = card.querySelector('.produto-preco')?.textContent || '';
    const descricao = card.dataset.descricao || '';
    const conteudo = normalizeSearchText(`${nome} ${preco} ${descricao}`);
    const match = !normalizedQuery || conteudo.includes(normalizedQuery);

    card.style.display = match ? '' : 'none';
    if (match) visibleCount += 1;
  });

  if (emptyState) {
    emptyState.hidden = visibleCount > 0;
  }

  if (clearBtn) {
    clearBtn.style.visibility = normalizedQuery ? 'visible' : 'hidden';
  }

  if (countLabel) {
    countLabel.textContent = `${visibleCount} produto${visibleCount === 1 ? '' : 's'}${normalizedQuery ? ' encontrado' + (visibleCount === 1 ? '' : 's') : ' disponíveis'}`;
  }
}

function injectProductSearch() {
  const section = document.querySelector('.produtos-section');
  const grid = section?.querySelector('.produtos-grid');

  if (!section || !grid || document.getElementById('produto-search-input')) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'produto-search-wrap';
  wrapper.innerHTML = `
    <div class="produto-search-header">
      <div>
        <span class="produto-search-kicker">Buscar coleção</span>
        <h2 class="produto-search-title">Encontre seu modelo ideal</h2>
        <p class="produto-search-text">Pesquise por nome, preço ou descrição e navegue pelos biquínis em um espaço dedicado.</p>
      </div>
      <span class="produto-search-count" id="produto-search-count"></span>
    </div>
    <div class="produto-search" role="search">
      <span class="produto-search-icon" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <circle cx="11" cy="11" r="7"></circle>
          <path d="M20 20L16.65 16.65"></path>
        </svg>
      </span>
      <input
        type="search"
        id="produto-search-input"
        class="produto-search-input"
        placeholder="Pesquisar produtos, cores, preço..."
        aria-label="Pesquisar produtos"
      />
      <button
        type="button"
        id="produto-search-clear"
        class="produto-search-clear"
        aria-label="Limpar pesquisa"
        style="visibility:hidden"
      >Limpar</button>
    </div>
    <p class="produto-search-empty" id="produto-search-empty" hidden>Nenhum produto encontrado.</p>
  `;

  section.insertBefore(wrapper, grid);

  const input = document.getElementById('produto-search-input');
  const clearBtn = document.getElementById('produto-search-clear');

  if (input) {
    input.addEventListener('input', () => {
      filterProductCards(input.value);
    });
  }

  if (clearBtn && input) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      filterProductCards('');
      input.focus();
    });
  }

  filterProductCards('');
}

function initBuyButtons() {
  if (!document.querySelector('.produtos-grid')) return;

  /* Painel lateral — botão "Adicionar ao Carrinho" */
  document.querySelectorAll('.produto-painel .produto-overlay-btn').forEach(btn => {
    const card = btn.closest('.produto-card');
    if (!card) return;
    const name = card.querySelector('.produto-nome')?.textContent || '';
    const price = card.querySelector('.produto-preco')?.textContent || '';
    const imgAtiva = () => card.querySelector('.produto-slide.ativo img')?.getAttribute('src')
                       || card.querySelector('img')?.getAttribute('src') || '';

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const tamAtivo = card.querySelector('.tam-btn.ativo');
      if (!tamAtivo) {
        const tamanhos = card.querySelector('.painel-tamanhos');
        tamanhos.style.outline = '1px solid #C9A96E';
        tamanhos.style.outlineOffset = '4px';
        setTimeout(() => { tamanhos.style.outline = 'none'; }, 1200);
        return;
      }
      addToCart(`${name} (${tamAtivo.textContent})`, price, imgAtiva());
    });
  });

  /* Clique na área de imagem — abre modal */
  document.querySelectorAll('.produto-img-wrap').forEach(wrap => {
    wrap.addEventListener('click', (e) => {
      if (e.target.closest('.slide-btn') || e.target.closest('.slide-dot') || e.target.closest('.produto-painel')) return;
      const card = wrap.closest('.produto-card');
      if (!card) return;
      const name = card.querySelector('.produto-nome')?.textContent || '';
      const price = card.querySelector('.produto-preco')?.textContent || '';
      const img = wrap.querySelector('.produto-slide.ativo img')?.getAttribute('src')
               || wrap.querySelector('img')?.getAttribute('src') || '';
      abrirModal(name, price, img, card);
    });
  });
}

/* Tecla ESC fecha o modal */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    fecharModal();
    closeSideMenu();
    closeCart();
    closeProfile();
    closeLoginModal();
  }
});

/* ── Injetar botões de carrinho e perfil na navbar ── */
function injectNavButtons() {
  const navEl = document.getElementById('navbar');
  if (!navEl) return;

  const cta = navEl.querySelector('.nav-cta');
  if (!cta) return;

  /* Esconde o link "Comprar" original e substitui pelos ícones */
  cta.style.display = 'none';

  const controls = document.createElement('div');
  controls.className = 'nav-controls';
  controls.innerHTML = `
    <button id="nav-login-btn" class="nav-icon-btn" onclick="openLoginModal()">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
      <span>Entrar</span>
    </button>
    <button id="nav-profile-btn" class="nav-icon-btn" onclick="openProfile()" style="display:none">
      <div class="profile-avatar"></div>
    </button>
    <button class="nav-icon-btn cart-nav-btn" onclick="openCart()">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 01-8 0"/>
      </svg>
      <span id="cart-badge" class="cart-badge" style="display:none">0</span>
    </button>
  `;
  navEl.appendChild(controls);

  const menuButton = document.createElement('button');
  menuButton.className = 'nav-icon-btn nav-menu-btn';
  menuButton.type = 'button';
  menuButton.setAttribute('aria-label', 'Abrir menu de navegação');
  menuButton.setAttribute('onclick', 'openSideMenu()');
  menuButton.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M3 6h18"></path>
      <path d="M3 12h18"></path>
      <path d="M3 18h18"></path>
    </svg>
    <span>Menu</span>
  `;

  function syncNavMenuButton() {
    const isMobile = window.innerWidth <= 768;
    const hasButton = navEl.contains(menuButton);

    if (isMobile && !hasButton) {
      navEl.insertBefore(menuButton, navEl.firstChild);
    }

    if (!isMobile && hasButton) {
      menuButton.remove();
      closeSideMenu();
    }
  }

  syncNavMenuButton();
  window.addEventListener('resize', syncNavMenuButton);
}

/* ══════════════════════════════════════════
   INIT
══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  injectGlobalUI();
  injectNavButtons();
  injectModal();
  injectProductSearch();
  initReveal();
  initCarrosseis();
  initBuyButtons();
  updateAuthUI();
  updateCartUI();
});
