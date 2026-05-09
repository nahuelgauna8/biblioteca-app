# 📚 Sistema de Gestión de Biblioteca

## 🧠 Descripción del proyecto

Este proyecto consiste en el desarrollo de una aplicación web para la gestión de una biblioteca digital.

El sistema permite a los usuarios registrarse, iniciar sesión, visualizar libros disponibles y realizar préstamos de forma sencilla e intuitiva.

Se implementó una arquitectura cliente-servidor, separando el frontend del backend.

---

## ⚙️ Tecnologías utilizadas

### Backend
- Node.js
- Express
- PostgreSQL
- JWT (JSON Web Token)
- bcryptjs (encriptación de contraseñas)

### Frontend
- HTML
- CSS
- JavaScript

---

## 🧩 Funcionalidades implementadas

- Registro de usuarios
- Inicio de sesión con autenticación
- Protección de rutas mediante token JWT
- Visualización de libros
- Búsqueda de libros por nombre
- Alta, baja y modificación de libros (CRUD)
- Préstamo de libros con control de stock
- Interfaz dinámica sin necesidad de recargar la página

---

## 🔐 Autenticación

El sistema utiliza autenticación basada en tokens JWT.

Al iniciar sesión:
- Se genera un token en el servidor
- El token se guarda en el navegador
- Se envía en cada petición protegida

Esto permite identificar al usuario sin necesidad de mantener sesiones en el servidor.

---

## 🔄 Manejo de préstamos

El proceso de préstamo se realiza mediante una transacción en la base de datos:

1. Se verifica que el libro tenga stock disponible
2. Se registra el préstamo
3. Se actualiza el stock del libro
4. Se confirma la operación

En caso de error, se cancelan los cambios para mantener la consistencia de los datos.

---

## 🎨 Interfaz de usuario

Se desarrolló una interfaz amigable y moderna que incluye:

- Menú hamburguesa para navegación
- Vista de perfil de usuario
- Buscador de libros en tiempo real
- Botones de acción para préstamos

Además, se eliminó el uso de IDs manuales en la interfaz para mejorar la experiencia del usuario.

---

## 🗂️ Estructura del proyecto

- index.js → Backend (API y lógica del servidor)
- public/
  - index.html → estructura de la interfaz
  - styles.css → estilos visuales
  - script.js → lógica del frontend

---

## 🚀 Conclusión

Este proyecto permitió aplicar conocimientos de desarrollo web full stack, integrando:

- Base de datos relacional
- Backend con API REST
- Autenticación segura
- Interfaz interactiva

El resultado es una aplicación funcional que simula el funcionamiento básico de un sistema de biblioteca.