/**
 * API сервер для системы управления библиотекой
 * "Книги Сказочного Края"
 * 
 * Требования: Node.js 18+, MySQL 8.0+
 */

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// =====================================================
// Подключение к MySQL
// =====================================================
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'lib_user',
  password: process.env.DB_PASSWORD || 'radostnochitat',
  database: process.env.DB_NAME || 'library_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// Проверка подключения
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Ошибка подключения к MySQL:', err.message);
    console.error('Проверьте настройки в файле .env');
    process.exit(1);
  }
  console.log('✅ Успешное подключение к MySQL');
  connection.release();
});

// =====================================================
// Middleware для логирования запросов
// =====================================================
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// =====================================================
// API ROUTES
// =====================================================

/**
 * GET /api/books
 * Получить все книги с информацией о читателях
 */
app.get('/api/books', (req, res) => {
  const sql = `
    SELECT 
      b.id, b.title, b.author, b.cover_type, b.publication_year, 
      b.genre, b.page_count, b.condition_state, b.status, 
      DATE_FORMAT(b.borrowed_date, '%Y-%m-%d') as borrowed_date,
      b.borrower_phone,
      r.first_name, r.last_name 
    FROM books b 
    LEFT JOIN readers r ON b.borrower_phone = r.phone
    ORDER BY b.title ASC
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Ошибка при получении книг:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

/**
 * GET /api/books/:id
 * Получить книгу по ID
 */
app.get('/api/books/:id', (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT 
      b.*, 
      DATE_FORMAT(b.borrowed_date, '%Y-%m-%d') as borrowed_date,
      r.first_name, r.last_name 
    FROM books b 
    LEFT JOIN readers r ON b.borrower_phone = r.phone
    WHERE b.id = ?
  `;
  
  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Книга не найдена' });
    res.json(results[0]);
  });
});

/**
 * POST /api/books
 * Добавить новую книгу
 */
app.post('/api/books', (req, res) => {
  const { 
    title, author, coverType, publicationYear, 
    genre, pageCount, conditionState, status 
  } = req.body;

  // Валидация
  if (!title || !author) {
    return res.status(400).json({ error: 'Название и автор обязательны' });
  }

  if (title.length > 255 || author.length > 255) {
    return res.status(400).json({ error: 'Название и автор не должны превышать 255 символов' });
  }

  const sql = `
    INSERT INTO books 
    (title, author, cover_type, publication_year, genre, page_count, condition_state, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    title.trim(), 
    author.trim(), 
    coverType || 'твердая', 
    publicationYear || new Date().getFullYear(), 
    genre?.trim() || 'Не указан', 
    pageCount || 0, 
    conditionState || 'хорошее', 
    status || 'свободна'
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Ошибка при добавлении книги:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Книга добавлена успешно', id: result.insertId });
  });
});

/**
 * PUT /api/books/:id
 * Обновить информацию о книге
 */
app.put('/api/books/:id', (req, res) => {
  const { id } = req.params;
  const { 
    title, author, coverType, publicationYear, 
    genre, pageCount, conditionState 
  } = req.body;

  const sql = `
    UPDATE books SET
      title = COALESCE(?, title),
      author = COALESCE(?, author),
      cover_type = COALESCE(?, cover_type),
      publication_year = COALESCE(?, publication_year),
      genre = COALESCE(?, genre),
      page_count = COALESCE(?, page_count),
      condition_state = COALESCE(?, condition_state)
    WHERE id = ?
  `;

  db.query(sql, [title, author, coverType, publicationYear, genre, pageCount, conditionState, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Книга не найдена' });
    res.json({ message: 'Книга обновлена' });
  });
});

/**
 * DELETE /api/books/:id
 * Удалить книгу
 */
app.delete('/api/books/:id', (req, res) => {
  const { id } = req.params;
  
  db.query('DELETE FROM books WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.error('Ошибка при удалении книги:', err);
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Книга не найдена' });
    }
    res.json({ message: 'Книга удалена' });
  });
});

/**
 * GET /api/readers
 * Получить всех читателей
 */
app.get('/api/readers', (req, res) => {
  const sql = `
    SELECT 
      phone, first_name, last_name, 
      DATE_FORMAT(birth_date, "%Y-%m-%d") AS birth_date, 
      DATE_FORMAT(registration_date, "%Y-%m-%d") AS registration_date 
    FROM readers
    ORDER BY registration_date DESC, last_name ASC
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Ошибка при получении читателей:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

/**
 * GET /api/readers/:phone
 * Получить читателя по телефону
 */
app.get('/api/readers/:phone', (req, res) => {
  const { phone } = req.params;
  const sql = `
    SELECT 
      phone, first_name, last_name, 
      DATE_FORMAT(birth_date, "%Y-%m-%d") AS birth_date, 
      DATE_FORMAT(registration_date, "%Y-%m-%d") AS registration_date 
    FROM readers
    WHERE phone = ?
  `;
  
  db.query(sql, [phone], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Читатель не найден' });
    res.json(results[0]);
  });
});

/**
 * POST /api/readers
 * Зарегистрировать нового читателя
 */
app.post('/api/readers', (req, res) => {
  const { phone, firstName, lastName, dob } = req.body;
  
  // Валидация
  if (!phone || !firstName || !lastName || !dob) {
    return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
  }

  // Проверка формата телефона
  const phoneRegex = /^7\d{10}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ error: 'Номер телефона должен быть в формате 7XXXXXXXXXX' });
  }

  if (firstName.length > 100 || lastName.length > 100) {
    return res.status(400).json({ error: 'Имя и фамилия не должны превышать 100 символов' });
  }

  const sql = 'INSERT INTO readers (phone, first_name, last_name, birth_date) VALUES (?, ?, ?, ?)';
  
  db.query(sql, [phone, firstName.trim(), lastName.trim(), dob], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Читатель с таким телефоном уже существует' });
      }
      console.error('Ошибка при регистрации читателя:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Читатель зарегистрирован', id: phone });
  });
});

/**
 * DELETE /api/readers/:phone
 * Удалить читателя
 */
app.delete('/api/readers/:phone', (req, res) => {
  const { phone } = req.params;
  
  // Сначала проверяем, есть ли книги на руках у читателя
  db.query('SELECT COUNT(*) as count FROM books WHERE borrower_phone = ?', [phone], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (results[0].count > 0) {
      return res.status(400).json({ 
        error: `Нельзя удалить читателя. На руках ${results[0].count} книг(и). Сначала верните все книги.` 
      });
    }
    
    db.query('DELETE FROM readers WHERE phone = ?', [phone], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Читатель не найден' });
      res.json({ message: 'Читатель удален' });
    });
  });
});

/**
 * POST /api/borrow
 * Выдать книгу читателю
 */
app.post('/api/borrow', (req, res) => {
  const { bookId, phone } = req.body;
  
  if (!bookId || !phone) {
    return res.status(400).json({ error: 'Не указан ID книги или телефон читателя' });
  }

  // Проверяем существование читателя
  db.query('SELECT phone FROM readers WHERE phone = ?', [phone], (err, readers) => {
    if (err) return res.status(500).json({ error: err.message });
    if (readers.length === 0) {
      return res.status(404).json({ error: 'Читатель не найден. Сначала зарегистрируйте его.' });
    }

    // Выдаем книгу
    const sql = `
      UPDATE books 
      SET status = 'на руках', borrower_phone = ?, borrowed_date = CURDATE() 
      WHERE id = ? AND status = 'свободна'
    `;
    
    db.query(sql, [phone, bookId], (err, result) => {
      if (err) {
        console.error('Ошибка при выдаче книги:', err);
        return res.status(500).json({ error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(400).json({ error: 'Книга недоступна (уже на руках) или не найдена' });
      }
      res.json({ message: 'Книга выдана успешно' });
    });
  });
});

/**
 * POST /api/return
 * Вернуть книгу в библиотеку
 */
app.post('/api/return', (req, res) => {
  const { bookId } = req.body;
  
  if (!bookId) {
    return res.status(400).json({ error: 'Не указан ID книги' });
  }

  const sql = `
    UPDATE books 
    SET status = 'свободна', borrower_phone = NULL, borrowed_date = NULL 
    WHERE id = ?
  `;
  
  db.query(sql, [bookId], (err, result) => {
    if (err) {
      console.error('Ошибка при возврате книги:', err);
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Книга не найдена' });
    }
    res.json({ message: 'Книга возвращена' });
  });
});

/**
 * GET /api/stats
 * Получить статистику библиотеки
 */
app.get('/api/stats', (req, res) => {
  const sql = 'SELECT * FROM v_library_stats';
  
  db.query(sql, (err, results) => {
    if (err) {
      // Если представление не существует, считаем вручную
      const fallbackSql = `
        SELECT
          (SELECT COUNT(*) FROM books) AS total_books,
          (SELECT COUNT(*) FROM books WHERE status = 'свободна') AS available_books,
          (SELECT COUNT(*) FROM books WHERE status = 'на руках') AS borrowed_books,
          (SELECT COUNT(*) FROM readers) AS total_readers
      `;
      db.query(fallbackSql, (err2, results2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json(results2[0]);
      });
      return;
    }
    res.json(results[0]);
  });
});

/**
 * GET /api/overdue
 * Получить просроченные книги
 */
app.get('/api/overdue', (req, res) => {
  const sql = `
    SELECT 
      b.id,
      b.title,
      b.author,
      DATE_FORMAT(b.borrowed_date, '%Y-%m-%d') as borrowed_date,
      DATEDIFF(CURRENT_DATE, b.borrowed_date) AS days_overdue,
      r.phone AS reader_phone,
      r.first_name,
      r.last_name
    FROM books b
    JOIN readers r ON b.borrower_phone = r.phone
    WHERE b.status = 'на руках' 
      AND DATEDIFF(CURRENT_DATE, b.borrowed_date) > 14
    ORDER BY days_overdue DESC
  `;
  
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// =====================================================
// Health check
// =====================================================
app.get('/api/health', (req, res) => {
  db.query('SELECT 1', (err) => {
    if (err) {
      return res.status(500).json({ 
        status: 'error', 
        message: 'Database connection failed',
        error: err.message 
      });
    }
    res.json({ 
      status: 'ok', 
      message: 'API сервер работает',
      timestamp: new Date().toISOString()
    });
  });
});

// =====================================================
// Обработка ошибок
// =====================================================
app.use((err, req, res, next) => {
  console.error('Внутренняя ошибка сервера:', err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// 404 для несуществующих маршрутов
app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

// =====================================================
// Запуск сервера
// =====================================================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════');
  console.log('  📚 Книги Сказочного Края - API Сервер');
  console.log('═══════════════════════════════════════════');
  console.log(`  🚀 Сервер запущен на порту ${PORT}`);
  console.log(`  📡 API доступен по адресу: http://localhost:${PORT}/api`);
  console.log('═══════════════════════════════════════════');
});
