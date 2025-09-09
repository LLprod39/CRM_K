-- Добавляем новый статус PREPAID в enum LessonStatus
-- SQLite не поддерживает ALTER TYPE, поэтому нужно пересоздать таблицу

-- Сначала создаем новую таблицу с обновленным enum
CREATE TABLE lessons_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATETIME NOT NULL,
  studentId INTEGER NOT NULL,
  cost REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'PAID', 'PREPAID')),
  notes TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE
);

-- Копируем данные из старой таблицы
INSERT INTO lessons_new (id, date, studentId, cost, status, notes, createdAt, updatedAt)
SELECT id, date, studentId, cost, status, notes, createdAt, updatedAt
FROM lessons;

-- Удаляем старую таблицу
DROP TABLE lessons;

-- Переименовываем новую таблицу
ALTER TABLE lessons_new RENAME TO lessons;

-- Создаем индексы
CREATE INDEX lessons_studentId_idx ON lessons(studentId);
CREATE INDEX lessons_date_idx ON lessons(date);
CREATE INDEX lessons_status_idx ON lessons(status);
