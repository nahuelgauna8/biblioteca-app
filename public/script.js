const API_URL = 'https://biblioteca-app-sp1c.onrender.com';

let isLogin = true;
let editMode = false;
let currentUser = null;
let allBooks = [];

// MENSAJES
function showMessage(msg, type = 'success') {

  const toast = document.getElementById('toast');

  toast.textContent = msg;

  toast.style.display = 'block';

  toast.style.backgroundColor =
    type === 'success'
      ? '#10b981'
      : '#ef4444';

  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

// HEADERS
function getHeaders() {

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  };
}

// NAVEGACIÓN
async function switchView(view) {

  document.getElementById('view-home').style.display =
    view === 'home'
      ? 'block'
      : 'none';

  document.getElementById('view-profile').style.display =
    view === 'profile'
      ? 'block'
      : 'none';

  if(view === 'profile') {

    document.getElementById('prof-name').innerText =
      currentUser.nombre;

    document.getElementById('prof-email').innerText =
      currentUser.email;

    document.getElementById('prof-id').innerText =
      currentUser.id;

    // HISTORIAL
    const res = await fetch(
      `${API_URL}/prestamos`,
      {
        headers: getHeaders()
      }
    );

    const prestamos = await res.json();

    const loansList =
      document.getElementById('loans-list');

    loansList.innerHTML = '';

    prestamos.forEach(p => {

      loansList.innerHTML += `

        <div class="loan-card">

          <p>
            <b>${p.titulo}</b>
          </p>

          <p>
            Estado:
            ${p.estado}
          </p>

          <p>
            Fecha:
            ${new Date(
              p.fecha_prestamo
            ).toLocaleDateString()}
          </p>

          ${
            p.estado === 'prestado'
            ?
            `
              <button
                onclick="devolver(${p.id})"
                class="btn-success"
              >
                Devolver
              </button>
            `
            :
            ''
          }

        </div>
      `;
    });
  }
}

// AUTH
document.getElementById('auth-form')
.addEventListener('submit', async (e) => {

  e.preventDefault();

  const body = {

    email:
      document.getElementById('email').value,

    password:
      document.getElementById('password').value,

    nombre:
      document.getElementById('nombre').value
  };

  const endpoint =
    isLogin
      ? '/login'
      : '/register';

  try {

    const res = await fetch(
      `${API_URL}${endpoint}`,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify(body)
      }
    );

    const data = await res.json();

    if (!res.ok)
      throw new Error(data.error);

    if (isLogin) {

      localStorage.setItem(
        'token',
        data.token
      );

      localStorage.setItem(
        'userData',
        JSON.stringify(data.user)
      );

      location.reload();

    } else {

      showMessage(
        'Registrado correctamente'
      );

      document
        .getElementById('toggle-auth')
        .click();
    }

  } catch (err) {

    showMessage(
      err.message,
      'error'
    );
  }
});

// OBTENER LIBROS
async function fetchBooks() {

  const res = await fetch(
    `${API_URL}/libros`,
    {
      headers: getHeaders()
    }
  );

  allBooks = await res.json();

  renderBooks(allBooks);
}

// MOSTRAR LIBROS
function renderBooks(books) {

  const grid =
    document.getElementById('books-grid');

  grid.innerHTML = '';

  books.forEach(book => {

    const div =
      document.createElement('div');

    div.className = 'book-card';

    div.innerHTML = `

      <span class="badge-cat">
        CAT ${book.id_categoria}
      </span>

      <h4 style="margin:10px 0 5px 0;">
        ${book.titulo}
      </h4>

      <p style="
        color:#8d99ae;
        font-size:0.85rem;
        margin:0;
      ">
        ${book.autor}
      </p>

      <div class="book-footer">

        <span class="stock-tag
          ${book.stock <= 0 ? 'no-stock' : ''}
        ">
          ${book.stock} unid.
        </span>

        <div class="actions">

          <button
            onclick="prestar(${book.id})"
            class="btn-action"
          >
            Prestar
          </button>

          <button
            onclick='prepareEdit(${JSON.stringify(book)})'
            class="btn-action"
          >
            ✏️
          </button>

          <button
            onclick="borrar(${book.id})"
            class="btn-action"
          >
            🗑️
          </button>

        </div>

      </div>
    `;

    grid.appendChild(div);
  });
}

// BUSCADOR
document.getElementById('search-input')
.addEventListener('input', (e) => {

  const val =
    e.target.value.toLowerCase();

  renderBooks(

    allBooks.filter(b =>

      b.titulo
        .toLowerCase()
        .includes(val)

      ||

      b.autor
        .toLowerCase()
        .includes(val)
    )
  );
});

// PRESTAR
async function prestar(id) {

  const res = await fetch(
    `${API_URL}/prestar`,
    {
      method: 'POST',

      headers: getHeaders(),

      body: JSON.stringify({
        id_usuario: currentUser.id,
        id_libro: id
      })
    }
  );

  if (res.ok) {

    showMessage(
      'Préstamo realizado'
    );

    fetchBooks();
  }
}

// DEVOLVER
async function devolver(id) {

  const res = await fetch(
    `${API_URL}/devolver/${id}`,
    {
      method: 'PUT',
      headers: getHeaders()
    }
  );

  if(res.ok) {

    showMessage(
      'Libro devuelto'
    );

    switchView('profile');

    fetchBooks();
  }
}

// BORRAR
async function borrar(id) {

  if (confirm('¿Eliminar?')) {

    await fetch(
      `${API_URL}/libros/${id}`,
      {
        method: 'DELETE',
        headers: getHeaders()
      }
    );

    fetchBooks();
  }
}

// FORM LIBROS
document.getElementById('book-form')
.addEventListener('submit', async (e) => {

  e.preventDefault();

  const id =
    document.getElementById('book-id').value;

  const body = {

    titulo:
      document.getElementById('titulo').value,

    autor:
      document.getElementById('autor').value,

    stock: parseInt(
      document.getElementById('stock').value
    ),

    id_categoria: parseInt(
      document.getElementById('id_categoria').value
    )
  };

  const method =
    editMode
      ? 'PUT'
      : 'POST';

  const url =
    editMode
      ? `${API_URL}/libros/${id}`
      : `${API_URL}/libros`;

  const res = await fetch(
    url,
    {
      method,
      headers: getHeaders(),
      body: JSON.stringify(body)
    }
  );

  if (res.ok) {

    resetBookForm();

    fetchBooks();

    showMessage('Guardado');
  }
});

// EDITAR
function prepareEdit(book) {

  editMode = true;

  document.getElementById('form-title')
    .innerText = 'Editar Libro';

  document.getElementById('book-id').value =
    book.id;

  document.getElementById('titulo').value =
    book.titulo;

  document.getElementById('autor').value =
    book.autor;

  document.getElementById('stock').value =
    book.stock;

  document.getElementById('id_categoria').value =
    book.id_categoria;

  document.getElementById('cancel-edit')
    .style.display = 'block';
}

// RESET FORM
function resetBookForm() {

  editMode = false;

  document.getElementById('book-form').reset();

  document.getElementById('form-title')
    .innerText = 'Gestionar Libro';

  document.getElementById('cancel-edit')
    .style.display = 'none';
}

// INICIO
function init() {

  const user =
    localStorage.getItem('userData');

  if (user) {

    currentUser = JSON.parse(user);

    document.getElementById('nav-user-name')
      .innerText = currentUser.nombre;

    document.getElementById('auth-container')
      .style.display = 'none';

    document.getElementById('main-container')
      .style.display = 'block';

    fetchBooks();
  }
}

// MENU
document.getElementById('user-badge')
.addEventListener('click', (e) => {

  e.stopPropagation();

  const menu =
    document.getElementById('menu-dropdown');

  menu.style.display =
    menu.style.display === 'flex'
      ? 'none'
      : 'flex';
});

document.getElementById('menu-btn')
.addEventListener('click', (e) => {

  e.stopPropagation();

  const menu =
    document.getElementById('menu-dropdown');

  menu.style.display =
    menu.style.display === 'flex'
      ? 'none'
      : 'flex';
});

document.addEventListener(
  'click',
  () => {
    document.getElementById(
      'menu-dropdown'
    ).style.display = 'none';
  }
);

// LOGOUT
document.getElementById('logout-btn')
.addEventListener('click', () => {

  localStorage.clear();

  location.reload();
});

// PERFIL
document.getElementById('perfil-nav-btn')
.addEventListener('click', () => {

  switchView('profile');
});

// VOLVER
document.getElementById('back-home-btn')
.addEventListener('click', () => {

  switchView('home');
});

// LOGIN / REGISTER
document.getElementById('toggle-auth')
.addEventListener('click', () => {

  isLogin = !isLogin;

  document.getElementById('auth-title')
    .innerText =
      isLogin
        ? 'Bienvenido'
        : 'Crear Cuenta';

  document.getElementById('name-group')
    .style.display =
      isLogin
        ? 'none'
        : 'block';
});

init();