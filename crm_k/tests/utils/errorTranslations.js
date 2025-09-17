// Переводы ошибок API на русский язык
const ERROR_TRANSLATIONS = {
  // Общие ошибки
  'Authentication required': 'Требуется аутентификация',
  'Access denied': 'Доступ запрещен',
  'Not found': 'Не найдено',
  'Invalid request': 'Неверный запрос',
  'Internal server error': 'Внутренняя ошибка сервера',
  'Validation failed': 'Ошибка валидации',
  'Unauthorized': 'Нет разрешения на доступ',
  'Forbidden': 'Доступ запрещен',
  'Bad Request': 'Неверный запрос',
  'Not Found': 'Не найдено',
  'Conflict': 'Конфликт данных',
  'Timeout': 'Превышено время ожидания',
  
  // Ошибки пользователей
  'User not found': 'Пользователь не найден',
  'Invalid credentials': 'Неверные учетные данные',
  'Email already exists': 'Email уже существует',
  'Password too weak': 'Пароль слишком слабый',
  'Invalid email format': 'Неверный формат email',
  'User already exists': 'Пользователь уже существует',
  'Cannot delete admin user': 'Нельзя удалить администратора',
  'Invalid user role': 'Неверная роль пользователя',
  
  // Ошибки учеников
  'Student not found': 'Ученик не найден',
  'Student already exists': 'Ученик уже существует',
  'Invalid student data': 'Неверные данные ученика',
  'Student has active lessons': 'У ученика есть активные уроки',
  'Student name is required': 'Имя ученика обязательно',
  'Student age is required': 'Возраст ученика обязателен',
  'Invalid student age': 'Неверный возраст ученика',
  
  // Ошибки уроков
  'Lesson not found': 'Урок не найден',
  'Invalid lesson data': 'Неверные данные урока',
  'Lesson time conflict': 'Конфликт времени урока',
  'Invalid lesson status transition': 'Недопустимый переход статуса урока',
  'Teacher not available': 'Учитель недоступен',
  'Student not available': 'Ученик недоступен',
  'Lesson date is required': 'Дата урока обязательна',
  'Lesson time is required': 'Время урока обязательно',
  'Invalid lesson duration': 'Неверная продолжительность урока',
  
  // Ошибки платежей
  'Payment not found': 'Платеж не найден',
  'Invalid payment data': 'Неверные данные платежа',
  'Payment amount must be positive': 'Сумма платежа должна быть положительной',
  'Payment date is required': 'Дата платежа обязательна',
  'Payment type is required': 'Тип платежа обязателен',
  'Invalid payment type': 'Неверный тип платежа',
  'Payment amount is required': 'Сумма платежа обязательна',
  
  // Ошибки финансов
  'Insufficient funds': 'Недостаточно средств',
  'Invalid financial data': 'Неверные финансовые данные',
  'Cannot delete paid lesson': 'Нельзя удалить оплаченный урок',
  'Balance calculation failed': 'Ошибка расчета баланса',
  'Revenue calculation failed': 'Ошибка расчета дохода',
  'Prepaid calculation failed': 'Ошибка расчета предоплаты',
  
  // Ошибки обеденных перерывов
  'Lunch break not found': 'Обеденный перерыв не найден',
  'Invalid lunch break time': 'Неверное время обеда',
  'Lunch break conflict': 'Конфликт времени обеда',
  'Lunch break start time is required': 'Время начала обеда обязательно',
  'Lunch break end time is required': 'Время окончания обеда обязательно',
  
  // Ошибки валидации полей
  'Required field missing': 'Обязательное поле отсутствует',
  'Invalid date format': 'Неверный формат даты',
  'Invalid time format': 'Неверный формат времени',
  'Invalid number format': 'Неверный формат числа',
  'String too long': 'Строка слишком длинная',
  'String too short': 'Строка слишком короткая',
  'Required': 'Обязательно для заполнения',
  'Invalid': 'Неверный формат',
  'Missing': 'Отсутствует',
  'Duplicate': 'Дубликат',
  'Expired': 'Истек срок действия',
  'Malformed': 'Неправильный формат',
  
  // Ошибки базы данных
  'Database connection failed': 'Ошибка подключения к базе данных',
  'Database query failed': 'Ошибка запроса к базе данных',
  'Transaction failed': 'Ошибка транзакции',
  'Constraint violation': 'Нарушение ограничений',
  'Unique constraint failed': 'Нарушение уникальности',
  'Foreign key constraint failed': 'Нарушение внешнего ключа',
  
  // Ошибки файлов
  'File not found': 'Файл не найден',
  'Invalid file format': 'Неверный формат файла',
  'File too large': 'Файл слишком большой',
  'Upload failed': 'Ошибка загрузки файла',
  'File upload failed': 'Ошибка загрузки файла',
  'Invalid file type': 'Неверный тип файла',
  
  // Ошибки экспорта
  'Export failed': 'Ошибка экспорта',
  'No data to export': 'Нет данных для экспорта',
  'Export format not supported': 'Формат экспорта не поддерживается',
  
  // Ошибки Jest
  'Expected': 'Ожидалось получить',
  'Received': 'Но получили',
  'toBe': 'должно быть равно',
  'toBeGreaterThan': 'должно быть больше чем',
  'toBeLessThan': 'должно быть меньше чем',
  'toContain': 'должно содержать',
  'toHaveProperty': 'должно иметь свойство',
  'toBeDefined': 'должно быть определено',
  'toBeUndefined': 'должно быть не определено',
  'toBeNull': 'должно быть пустым (null)',
  'toBeTruthy': 'должно быть истинным',
  'toBeFalsy': 'должно быть ложным',
  'toBeInstanceOf': 'должно быть экземпляром',
  'toMatch': 'должно соответствовать',
  'toThrow': 'должно выбросить ошибку',
  
  // Ошибки сети и производительности
  'Network error': 'Ошибка сети',
  'Connection timeout': 'Таймаут подключения',
  'Server unavailable': 'Сервер недоступен',
  'Rate limit exceeded': 'Превышен лимит запросов',
  'Service unavailable': 'Сервис недоступен'
}

// Функция для перевода ошибок
function translateError(errorMessage) {
  if (!errorMessage) return errorMessage
  
  // Ищем точное совпадение
  if (ERROR_TRANSLATIONS[errorMessage]) {
    return ERROR_TRANSLATIONS[errorMessage]
  }
  
  // Ищем частичные совпадения
  for (const [en, ru] of Object.entries(ERROR_TRANSLATIONS)) {
    if (errorMessage.includes(en)) {
      return errorMessage.replace(en, ru)
    }
  }
  
  return errorMessage
}

// Функция для создания переведенного сообщения об ошибке
function createTranslatedError(originalError, context = '') {
  const translated = translateError(originalError)
  return context ? `${translated} (${context})` : translated
}

module.exports = {
  ERROR_TRANSLATIONS,
  translateError,
  createTranslatedError
}
