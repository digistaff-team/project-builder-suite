-- =====================================================
-- Схема базы данных для системы управления библиотекой
-- "Книги Сказочного Края"
-- =====================================================

-- Создание базы данных
CREATE DATABASE IF NOT EXISTS library_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE library_db;

-- =====================================================
-- Таблица читателей (readers)
-- Телефон является уникальным идентификатором
-- =====================================================
CREATE TABLE IF NOT EXISTS readers (
    phone VARCHAR(11) PRIMARY KEY COMMENT 'Телефон в формате 7XXXXXXXXXX (уникальный ID читателя)',
    first_name VARCHAR(100) NOT NULL COMMENT 'Имя читателя',
    last_name VARCHAR(100) NOT NULL COMMENT 'Фамилия читателя',
    birth_date DATE NOT NULL COMMENT 'Дата рождения',
    registration_date DATE DEFAULT (CURRENT_DATE) COMMENT 'Дата регистрации в библиотеке',
    
    INDEX idx_readers_last_name (last_name),
    INDEX idx_readers_registration_date (registration_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Таблица читателей библиотеки';

-- =====================================================
-- Таблица книг (books)
-- =====================================================
CREATE TABLE IF NOT EXISTS books (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Уникальный идентификатор книги',
    title VARCHAR(255) NOT NULL COMMENT 'Название книги',
    author VARCHAR(255) NOT NULL COMMENT 'Автор книги',
    cover_type ENUM('мягкая', 'твердая') DEFAULT 'твердая' COMMENT 'Тип обложки',
    publication_year SMALLINT UNSIGNED COMMENT 'Год издания',
    genre VARCHAR(100) COMMENT 'Жанр книги',
    page_count SMALLINT UNSIGNED COMMENT 'Количество страниц',
    condition_state ENUM('новая', 'хорошее', 'среднее', 'плохое') DEFAULT 'хорошее' COMMENT 'Состояние книги',
    status ENUM('свободна', 'на руках') DEFAULT 'свободна' COMMENT 'Текущий статус книги',
    borrowed_date DATE DEFAULT NULL COMMENT 'Дата выдачи книги читателю',
    borrower_phone VARCHAR(11) DEFAULT NULL COMMENT 'Телефон читателя, которому выдана книга',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Дата добавления в каталог',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Дата последнего обновления',
    
    CONSTRAINT fk_books_borrower 
        FOREIGN KEY (borrower_phone) 
        REFERENCES readers(phone) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,
    
    INDEX idx_books_title (title),
    INDEX idx_books_author (author),
    INDEX idx_books_status (status),
    INDEX idx_books_genre (genre),
    INDEX idx_books_publication_year (publication_year),
    INDEX idx_books_borrowed_date (borrowed_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Таблица книг библиотеки';

-- =====================================================
-- Таблица истории выдач (borrow_history) - опционально
-- Для ведения истории всех операций выдачи/возврата
-- =====================================================
CREATE TABLE IF NOT EXISTS borrow_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL COMMENT 'ID книги',
    reader_phone VARCHAR(11) NOT NULL COMMENT 'Телефон читателя',
    borrow_date DATE NOT NULL COMMENT 'Дата выдачи',
    return_date DATE DEFAULT NULL COMMENT 'Дата возврата (NULL если книга еще не возвращена)',
    notes TEXT COMMENT 'Примечания',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_history_book 
        FOREIGN KEY (book_id) 
        REFERENCES books(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_history_reader 
        FOREIGN KEY (reader_phone) 
        REFERENCES readers(phone) 
        ON DELETE CASCADE,
    
    INDEX idx_history_book_id (book_id),
    INDEX idx_history_reader_phone (reader_phone),
    INDEX idx_history_borrow_date (borrow_date),
    INDEX idx_history_return_date (return_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='История выдач книг';

-- =====================================================
-- Представления (Views) для удобной работы с данными
-- =====================================================

-- Представление: Книги с информацией о читателе
CREATE OR REPLACE VIEW v_books_with_borrowers AS
SELECT 
    b.id,
    b.title,
    b.author,
    b.cover_type,
    b.publication_year,
    b.genre,
    b.page_count,
    b.condition_state,
    b.status,
    b.borrowed_date,
    b.borrower_phone,
    r.first_name,
    r.last_name,
    DATEDIFF(CURRENT_DATE, b.borrowed_date) AS days_borrowed
FROM books b
LEFT JOIN readers r ON b.borrower_phone = r.phone;

-- Представление: Статистика библиотеки
CREATE OR REPLACE VIEW v_library_stats AS
SELECT
    (SELECT COUNT(*) FROM books) AS total_books,
    (SELECT COUNT(*) FROM books WHERE status = 'свободна') AS available_books,
    (SELECT COUNT(*) FROM books WHERE status = 'на руках') AS borrowed_books,
    (SELECT COUNT(*) FROM readers) AS total_readers,
    (SELECT COUNT(*) FROM books WHERE status = 'на руках' AND DATEDIFF(CURRENT_DATE, borrowed_date) > 14) AS overdue_books;

-- Представление: Просроченные книги (более 14 дней)
CREATE OR REPLACE VIEW v_overdue_books AS
SELECT 
    b.id,
    b.title,
    b.author,
    b.borrowed_date,
    DATEDIFF(CURRENT_DATE, b.borrowed_date) AS days_overdue,
    r.phone AS reader_phone,
    r.first_name,
    r.last_name
FROM books b
JOIN readers r ON b.borrower_phone = r.phone
WHERE b.status = 'на руках' 
  AND DATEDIFF(CURRENT_DATE, b.borrowed_date) > 14
ORDER BY days_overdue DESC;

-- =====================================================
-- Тестовые данные
-- =====================================================

-- Добавление тестовых читателей
INSERT INTO readers (phone, first_name, last_name, birth_date, registration_date) VALUES
('79001234567', 'Иван', 'Петров', '1990-05-15', '2024-01-10'),
('79009876543', 'Мария', 'Сидорова', '1985-08-22', '2024-02-20'),
('79005554433', 'Алексей', 'Козлов', '1995-03-10', '2024-03-05'),
('79007778899', 'Елена', 'Новикова', '1988-11-30', '2024-04-15'),
('79002223344', 'Дмитрий', 'Смирнов', '1992-07-25', '2024-05-01')
ON DUPLICATE KEY UPDATE first_name = VALUES(first_name);

-- Добавление тестовых книг
INSERT INTO books (title, author, cover_type, publication_year, genre, page_count, condition_state, status, borrowed_date, borrower_phone) VALUES
('Война и мир', 'Лев Толстой', 'твердая', 1869, 'Роман', 1225, 'хорошее', 'свободна', NULL, NULL),
('Мастер и Маргарита', 'Михаил Булгаков', 'твердая', 1967, 'Роман', 480, 'новая', 'на руках', DATE_SUB(CURRENT_DATE, INTERVAL 5 DAY), '79001234567'),
('Преступление и наказание', 'Фёдор Достоевский', 'мягкая', 1866, 'Роман', 671, 'среднее', 'свободна', NULL, NULL),
('Анна Каренина', 'Лев Толстой', 'твердая', 1877, 'Роман', 864, 'хорошее', 'свободна', NULL, NULL),
('Евгений Онегин', 'Александр Пушкин', 'твердая', 1833, 'Поэма', 224, 'новая', 'на руках', DATE_SUB(CURRENT_DATE, INTERVAL 20 DAY), '79009876543'),
('Двенадцать стульев', 'Илья Ильф, Евгений Петров', 'мягкая', 1928, 'Сатира', 416, 'хорошее', 'свободна', NULL, NULL),
('Идиот', 'Фёдор Достоевский', 'твердая', 1869, 'Роман', 640, 'хорошее', 'свободна', NULL, NULL),
('Три товарища', 'Эрих Мария Ремарк', 'мягкая', 1936, 'Роман', 480, 'новая', 'на руках', DATE_SUB(CURRENT_DATE, INTERVAL 3 DAY), '79005554433'),
('1984', 'Джордж Оруэлл', 'твердая', 1949, 'Антиутопия', 320, 'хорошее', 'свободна', NULL, NULL),
('Гордость и предубеждение', 'Джейн Остин', 'мягкая', 1813, 'Роман', 432, 'среднее', 'свободна', NULL, NULL);

-- =====================================================
-- Полезные запросы для администратора
-- =====================================================

-- Получить все книги на руках с информацией о читателях:
-- SELECT * FROM v_books_with_borrowers WHERE status = 'на руках';

-- Получить просроченные книги:
-- SELECT * FROM v_overdue_books;

-- Получить статистику библиотеки:
-- SELECT * FROM v_library_stats;

-- Поиск книг по названию или автору:
-- SELECT * FROM books WHERE title LIKE '%война%' OR author LIKE '%толстой%';

-- Книги определенного жанра:
-- SELECT * FROM books WHERE genre = 'Роман' ORDER BY publication_year;
