const { translateError } = require('../utils/errorTranslations')

class RussianReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig
    this._options = options
    this.startTime = null
    this.testResults = []
    this.currentSuite = null
    this.totalTests = 0
    this.passedTests = 0
    this.failedTests = 0
    this.skippedTests = 0
  }

  onRunStart(results, options) {
    this.startTime = Date.now()
    this.totalTests = results.numTotalTests
    this.passedTests = 0
    this.failedTests = 0
    this.skippedTests = 0
    
    console.log('\n🚀 ЗАПУСК ТЕСТИРОВАНИЯ CRM СИСТЕМЫ')
    console.log('═'.repeat(80))
    console.log('📊 СТАТИСТИКА ТЕСТИРОВАНИЯ:')
    console.log(`   📁 Групп тестов: ${results.numTotalTestSuites}`)
    console.log(`   🧪 Всего тестов: ${results.numTotalTests}`)
    console.log(`   ⏳ Пропущено: ${results.numPendingTests}`)
    console.log('═'.repeat(80))
    console.log('🎯 ЦЕЛЬ: Проверить работоспособность всех компонентов системы')
    console.log('═'.repeat(80) + '\n')
  }

  onTestStart(test) {
    const testName = this.translateTestName(test.path)
    this.currentSuite = testName
    
    console.log(`\n🔍 ТЕСТИРУЕМ: ${testName}`)
    console.log('─'.repeat(80))
    console.log('📝 Описание: ' + this.getTestSuiteDescription(test.path))
    console.log('─'.repeat(80))
  }

  onTestResult(test, testResult, aggregatedResult) {
    const testName = this.translateTestName(test.path)
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2)
    
    // Обновляем счетчики
    this.passedTests += testResult.numPassingTests
    this.failedTests += testResult.numFailingTests
    this.skippedTests += testResult.numPendingTests
    
    if (testResult.numFailingTests === 0) {
      console.log(`\n✅ РЕЗУЛЬТАТ: ${testName} - УСПЕШНО ПРОЙДЕН`)
      console.log('─'.repeat(80))
      console.log(`📊 Статистика:`)
      console.log(`   ✅ Пройдено тестов: ${testResult.numPassingTests}`)
      console.log(`   ⏱️  Время выполнения: ${duration}с`)
      console.log(`   📈 Общий прогресс: ${this.passedTests}/${this.totalTests} (${((this.passedTests/this.totalTests)*100).toFixed(1)}%)`)
      
      // Показываем детали пройденных тестов
      if (testResult.numPassingTests > 0) {
        console.log('\n📝 ПРОЙДЕННЫЕ ПРОВЕРКИ:')
        testResult.testResults.forEach((result, index) => {
          if (result.status === 'passed') {
            console.log(`   ${index + 1}. ✅ ${this.translateTestDescription(result.title)}`)
          }
        })
      }
    } else {
      console.log(`\n❌ РЕЗУЛЬТАТ: ${testName} - ОБНАРУЖЕНЫ ПРОБЛЕМЫ`)
      console.log('─'.repeat(80))
      console.log(`📊 Статистика:`)
      console.log(`   ✅ Пройдено тестов: ${testResult.numPassingTests}`)
      console.log(`   ❌ Провалено тестов: ${testResult.numFailingTests}`)
      console.log(`   ⏱️  Время выполнения: ${duration}с`)
      console.log(`   📈 Общий прогресс: ${this.passedTests}/${this.totalTests} (${((this.passedTests/this.totalTests)*100).toFixed(1)}%)`)
      
      // Показываем пройденные тесты
      if (testResult.numPassingTests > 0) {
        console.log('\n✅ РАБОТАЕТ КОРРЕКТНО:')
        testResult.testResults.forEach((result, index) => {
          if (result.status === 'passed') {
            console.log(`   ${index + 1}. ✅ ${this.translateTestDescription(result.title)}`)
          }
        })
      }
      
      // Показываем детали ошибок
      console.log('\n❌ ТРЕБУЕТ ИСПРАВЛЕНИЯ:')
      testResult.testResults.forEach((result, index) => {
        if (result.status === 'failed') {
          console.log(`   ${index + 1}. ❌ ${this.translateTestDescription(result.title)}`)
          if (result.failureMessages && result.failureMessages.length > 0) {
            const errorMessage = this.translateErrorMessage(result.failureMessages[0])
            console.log(`      💡 Проблема: ${errorMessage}`)
            console.log(`      🔧 Что делать: ${this.getFixSuggestion(result.failureMessages[0])}`)
          }
        }
      })
    }
    
    this.testResults.push({
      name: testName,
      passed: testResult.numPassingTests,
      failed: testResult.numFailingTests,
      duration: duration,
      description: this.getTestSuiteDescription(test.path)
    })
    
    console.log('─'.repeat(80))
  }

  onRunComplete(contexts, results) {
    const { numTotalTests, numPassedTests, numFailedTests, numPendingTests } = results
    const totalDuration = ((Date.now() - this.startTime) / 1000).toFixed(2)
    
    console.log('\n' + '═'.repeat(80))
    console.log('📊 ФИНАЛЬНЫЙ ОТЧЕТ О ТЕСТИРОВАНИИ CRM СИСТЕМЫ')
    console.log('═'.repeat(80))
    
    // Общая статистика
    console.log('📈 ОБЩАЯ СТАТИСТИКА:')
    console.log(`   🧪 Всего тестов выполнено: ${numTotalTests}`)
    console.log(`   ✅ Успешно пройдено: ${numPassedTests}`)
    console.log(`   ❌ Обнаружено проблем: ${numFailedTests}`)
    console.log(`   ⏳ Пропущено: ${numPendingTests}`)
    console.log(`   ⏱️  Общее время выполнения: ${totalDuration}с`)
    
    const successRate = ((numPassedTests / numTotalTests) * 100).toFixed(1)
    
    // Детальная статистика по группам тестов
    console.log('\n📋 РЕЗУЛЬТАТЫ ПО КОМПОНЕНТАМ СИСТЕМЫ:')
    console.log('─'.repeat(80))
    this.testResults.forEach((result, index) => {
      const groupSuccessRate = result.failed === 0 ? 100 : ((result.passed / (result.passed + result.failed)) * 100).toFixed(1)
      const status = result.failed === 0 ? '✅' : '❌'
      console.log(`${index + 1}. ${status} ${result.name}`)
      console.log(`   📝 ${result.description}`)
      console.log(`   📊 Результат: ${result.passed} пройдено, ${result.failed} провалено (${groupSuccessRate}%)`)
      console.log(`   ⏱️  Время: ${result.duration}с`)
      console.log('')
    })
    
    // Общая оценка системы
    console.log('═'.repeat(80))
    console.log('🎯 ОЦЕНКА СОСТОЯНИЯ СИСТЕМЫ:')
    console.log('═'.repeat(80))
    
    if (numFailedTests === 0) {
      console.log(`🎉 ОТЛИЧНО! Все тесты пройдены успешно!`)
      console.log(`🌟 Успешность: ${successRate}%`)
      console.log('✨ Система полностью готова к работе!')
      console.log('🚀 Можно безопасно развертывать в продакшене!')
    } else if (successRate >= 90) {
      console.log(`🌟 ОЧЕНЬ ХОРОШО! Система работает стабильно!`)
      console.log(`📈 Успешность: ${successRate}%`)
      console.log('👍 Обнаружены только незначительные проблемы')
      console.log('🔧 Рекомендуется исправить мелкие недочеты')
    } else if (successRate >= 70) {
      console.log(`👍 ХОРОШО! Система в целом работает!`)
      console.log(`📈 Успешность: ${successRate}%`)
      console.log('⚠️  Есть проблемы, требующие внимания')
      console.log('🔧 Необходимо доработать некоторые функции')
    } else {
      console.log(`⚠️  ТРЕБУЕТСЯ СЕРЬЕЗНАЯ ДОРАБОТКА!`)
      console.log(`📈 Успешность: ${successRate}%`)
      console.log('🚨 Обнаружены критические проблемы')
      console.log('🛠️  Система нуждается в значительных исправлениях')
    }
    
    // Рекомендации по исправлению
    if (numFailedTests > 0) {
      console.log('\n🔧 РЕКОМЕНДАЦИИ ПО УЛУЧШЕНИЮ:')
      console.log('─'.repeat(80))
      console.log('   📋 Общие рекомендации:')
      console.log('   • Проверьте логи сервера на наличие ошибок')
      console.log('   • Убедитесь в правильности настройки базы данных')
      console.log('   • Проверьте корректность API endpoints')
      console.log('   • Убедитесь в правильности прав доступа пользователей')
      console.log('   • Проверьте формат передаваемых данных')
      console.log('   • Убедитесь в наличии всех зависимостей')
      console.log('')
      console.log('   🎯 Следующие шаги:')
      console.log('   1. Исправьте все проваленные тесты')
      console.log('   2. Запустите тесты повторно')
      console.log('   3. Убедитесь, что все функции работают корректно')
      console.log('   4. Проведите дополнительное тестирование')
    }
    
    console.log('\n' + '═'.repeat(80))
    console.log('🏁 ТЕСТИРОВАНИЕ ЗАВЕРШЕНО')
    console.log(`📅 Время завершения: ${new Date().toLocaleString('ru-RU')}`)
    console.log('═'.repeat(80) + '\n')
  }

  getTestSuiteDescription(testPath) {
    const descriptions = {
      'auth-api.test.js': 'Проверяет корректность входа пользователей в систему, валидацию паролей и токенов доступа',
      'users.test.js': 'Тестирует создание, изменение и удаление пользователей, проверяет права доступа',
      'students.test.js': 'Проверяет управление учениками: добавление, редактирование, удаление и поиск',
      'lessons.test.js': 'Тестирует создание уроков, изменение их статуса и управление расписанием',
      'payments.test.js': 'Проверяет обработку платежей, расчет балансов и финансовые операции',
      'finances.test.js': 'Тестирует финансовую отчетность, статистику доходов и расходов',
      'lunch-breaks.test.js': 'Проверяет управление обеденными перерывами и их влияние на расписание',
      'workflow.test.js': 'Тестирует полные рабочие процессы от создания ученика до завершения уроков',
      'app.test.js': 'Комплексное тестирование всего приложения в реальных условиях использования',
      'auth.test.js': 'Проверяет безопасность системы, валидацию токенов и защиту от атак',
      'utils.test.js': 'Тестирует вспомогательные функции для работы с данными и форматированием'
    }
    
    const fileName = testPath.split('/').pop()
    return descriptions[fileName] || 'Тестирование функциональности системы'
  }

  getFixSuggestion(errorMessage) {
    const suggestions = {
      'Authentication': 'Проверьте правильность логина и пароля',
      'Authorization': 'Убедитесь, что у пользователя есть необходимые права',
      'Not Found': 'Проверьте, существует ли запрашиваемый объект',
      'Bad Request': 'Проверьте формат отправляемых данных',
      'Internal Server Error': 'Проверьте логи сервера и состояние базы данных',
      'Unauthorized': 'Войдите в систему или обновите токен доступа',
      'Forbidden': 'Обратитесь к администратору для получения прав',
      'Conflict': 'Проверьте, нет ли дублирующихся данных',
      'Validation': 'Проверьте правильность заполнения всех полей',
      'Required': 'Заполните все обязательные поля',
      'Invalid': 'Исправьте формат данных согласно требованиям',
      'Missing': 'Добавьте недостающие данные',
      'Duplicate': 'Удалите дублирующиеся записи',
      'Expired': 'Обновите истекшие данные',
      'Malformed': 'Исправьте формат данных',
      'timeout': 'Увеличьте время ожидания или проверьте производительность',
      'network': 'Проверьте подключение к интернету',
      'database': 'Проверьте состояние базы данных и подключение'
    }

    for (const [key, suggestion] of Object.entries(suggestions)) {
      if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
        return suggestion
      }
    }
    
    return 'Обратитесь к документации или администратору системы'
  }

  translateTestName(testPath) {
    const pathMap = {
      'auth-api.test.js': '🔐 Проверка входа в систему',
      'users.test.js': '👥 Управление пользователями',
      'students.test.js': '🎓 Управление учениками',
      'lessons.test.js': '📚 Управление уроками',
      'payments.test.js': '💰 Управление платежами',
      'finances.test.js': '📊 Финансовая отчетность',
      'lunch-breaks.test.js': '🍽️ Управление обеденными перерывами',
      'workflow.test.js': '🔄 Полные рабочие процессы',
      'app.test.js': '🌐 Тестирование всего приложения',
      'auth.test.js': '🔑 Проверка безопасности',
      'utils.test.js': '🛠️ Вспомогательные функции'
    }
    
    const fileName = testPath.split('/').pop()
    return pathMap[fileName] || `📄 ${fileName}`
  }

  translateTestDescription(testTitle) {
    const translations = {
      // Аутентификация
      'should authenticate user with valid credentials': '🔐 Вход в систему с правильным паролем',
      'should login with valid credentials': '🔐 Вход в систему с правильными данными',
      'should reject invalid credentials': '🚫 Блокировка входа с неправильным паролем',
      'should reject non-existent user': '❌ Блокировка входа несуществующего пользователя',
      'should require authentication': '🔒 Проверка: нужен ли пароль для входа',
      'should validate token in protected routes': '🔑 Проверка токена в защищенных маршрутах',
      'should reject requests without token': '🚫 Блокировка запросов без токена',
      'should reject requests with invalid token': '🚫 Блокировка запросов с неверным токеном',
      'should handle expired tokens': '⏰ Обработка истекших токенов',
      'should allow ADMIN to access admin routes': '👑 Админ может получить доступ к админским маршрутам',
      'should deny USER access to admin routes': '🚫 Обычный пользователь не может получить доступ к админским маршрутам',
      'should allow USER to access user routes': '👤 Обычный пользователь может получить доступ к пользовательским маршрутам',
      
      // Пользователи
      'should return all users for admin': '👑 Админ видит всех пользователей',
      'should deny access to non-admin users': '🚫 Обычные пользователи не видят список всех пользователей',
      'should create new user': '➕ Создание нового пользователя',
      'should create new user (admin only)': '👑 Только админ может создавать пользователей',
      'should update user data': '✏️ Изменение данных пользователя',
      'should update user (admin only)': '👑 Только админ может изменять пользователей',
      'should update user password': '🔑 Смена пароля пользователя',
      'should delete user': '🗑️ Удаление пользователя',
      'should delete user (admin only)': '👑 Только админ может удалять пользователей',
      'should validate required fields': '✅ Проверка: все ли поля заполнены',
      'should validate unique email': '📧 Проверка: нет ли одинаковых email',
      'should validate email format': '📧 Проверка: правильный ли формат email',
      'should validate email uniqueness on update': '📧 Проверка: не занят ли email при изменении',
      'should return 404 for non-existent user': '❓ Что происходит, если пользователь не найден',
      'should cascade delete user\'s students and lessons': '🔗 При удалении пользователя удаляются его ученики и уроки',
      'should not allow deleting admin user': '🛡️ Нельзя удалить главного администратора',
      'should return user statistics (admin only)': '📊 Только админ видит статистику пользователей',
      
      // Ученики
      'should create new student': '➕ Создание нового ученика',
      'should update student data': '✏️ Изменение данных ученика',
      'should delete student': '🗑️ Удаление ученика',
      'should return all students for admin': '👑 Админ видит всех учеников',
      'should return only own students for regular user': '👤 Обычный пользователь видит только своих учеников',
      'should validate student data': '✅ Проверка данных ученика',
      'should handle student photo upload': '📸 Загрузка фотографии ученика',
      'should return students for authenticated user': '👤 Получение списка учеников для авторизованного пользователя',
      'should require authentication': '🔒 Проверка: нужен ли пароль для входа',
      'should validate required fields': '✅ Проверка: все ли поля заполнены',
      'should allow admin to create student for any user': '👑 Админ может создавать учеников для любого пользователя',
      'should update student': '✏️ Изменение данных ученика',
      'should not allow user to update other user\'s student': '🚫 Пользователь не может изменять чужих учеников',
      'should allow admin to update any student': '👑 Админ может изменять любого ученика',
      'should return 404 for non-existent student': '❓ Что происходит, если ученик не найден',
      'should delete student': '🗑️ Удаление ученика',
      'should not allow user to delete other user\'s student': '🚫 Пользователь не может удалять чужих учеников',
      'should allow admin to delete any student': '👑 Админ может удалять любого ученика',
      'should return student details': '📋 Получение подробной информации об ученике',
      'should include lessons for student': '📚 Включение уроков ученика в ответ',
      'should not allow user to view other user\'s student': '🚫 Пользователь не может просматривать чужих учеников',
      'should allow admin to view any student': '👑 Админ может просматривать любого ученика',
      
      // Уроки
      'should create new lesson': '➕ Создание нового урока',
      'should update lesson status': '✏️ Изменение статуса урока',
      'should delete lesson': '🗑️ Удаление урока',
      'should allow admin to update any lesson': '👑 Админ может изменять любой урок',
      'should allow teacher to update own lessons': '👨‍🏫 Учитель может изменять свои уроки',
      'should allow student owner to update lessons': '👤 Владелец ученика может изменять уроки',
      'should not allow user to update other user\'s lesson': '🚫 Нельзя изменять чужие уроки',
      'should not allow user to delete other user\'s lesson': '🚫 Нельзя удалять чужие уроки',
      'should validate lesson data': '✅ Проверка данных урока',
      'should handle lesson status transitions': '🔄 Проверка смены статуса урока',
      
      // Платежи
      'should create new payment': '➕ Создание нового платежа',
      'should update payment': '✏️ Изменение платежа',
      'should delete payment': '🗑️ Удаление платежа',
      'should allow admin to create payment for any student': '👑 Админ может создавать платежи за любого ученика',
      'should validate student exists': '✅ Проверка: существует ли ученик',
      'should validate payment amount': '💰 Проверка суммы платежа',
      'should filter payments by date range': '📅 Фильтрация платежей по датам',
      'should filter payments by student': '👤 Фильтрация платежей по ученику',
      
      // Финансы
      'should calculate financial stats': '📊 Расчет финансовой статистики',
      'should export financial data': '📤 Выгрузка финансовых данных',
      'should calculate student balance': '💰 Расчет баланса ученика',
      'should handle revenue calculations': '💵 Расчет доходов',
      'should handle prepaid calculations': '💳 Расчет предоплаты',
      
      // Обеденные перерывы
      'should create lunch break': '➕ Создание обеденного перерыва',
      'should update lunch break': '✏️ Изменение обеденного перерыва',
      'should delete lunch break': '🗑️ Удаление обеденного перерыва',
      'should validate lunch break time': '⏰ Проверка времени обеда',
      'should handle lunch break conflicts': '⚠️ Проверка конфликтов времени обеда',
      
      // Интеграционные тесты
      'should handle complete workflow': '🔄 Полный рабочий процесс',
      'should handle complete student lifecycle': '👶 Полный жизненный цикл ученика',
      'should handle complete financial workflow': '💰 Полный финансовый процесс',
      'should handle complete admin workflow': '👑 Полный процесс администратора',
      'should ensure data isolation between users': '🔒 Изоляция данных между пользователями',
      
      // E2E тесты
      'should complete login flow and redirect to dashboard': '🔐 Полный процесс входа в систему',
      'should handle login errors gracefully': '⚠️ Обработка ошибок входа',
      'should load dashboard data for authenticated user': '📊 Загрузка данных для авторизованного пользователя',
      'should show different data for admin vs regular user': '👑 Разные данные для админа и обычного пользователя',
      'should complete student CRUD operations': '👤 Полные операции с учениками',
      'should handle payment processing and lesson marking': '💰 Обработка платежей и отметка уроков',
      'should handle various error scenarios gracefully': '⚠️ Обработка различных ошибок',
      'should maintain data consistency across operations': '🔗 Сохранение целостности данных',
      
      // Общие проверки
      'should validate input data': '✅ Проверка введенных данных',
      'should handle errors gracefully': '⚠️ Корректная обработка ошибок',
      'should check permissions': '🔒 Проверка разрешений',
      'should validate data format': '📋 Проверка формата данных',
      'should handle database errors': '🗄️ Обработка ошибок базы данных',
      'should handle network errors': '🌐 Обработка сетевых ошибок'
    }
    
    return translations[testTitle] || testTitle
  }

  translateErrorMessage(errorMessage) {
    // Сначала применяем переводы ошибок
    let translatedMessage = translateError(errorMessage)
    
    // Затем применяем общие переводы Jest с более понятными формулировками
    const translations = {
      'Expected:': 'Ожидалось получить:',
      'Received:': 'Но получили:',
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
      'Authentication': 'Проблема с входом в систему',
      'Authorization': 'Проблема с правами доступа',
      'Not Found': 'Не найдено',
      'Bad Request': 'Неверный запрос',
      'Internal Server Error': 'Ошибка сервера',
      'Unauthorized': 'Нет разрешения на доступ',
      'Forbidden': 'Доступ запрещен',
      'Conflict': 'Конфликт данных',
      'Validation': 'Ошибка проверки данных',
      'Required': 'Обязательно для заполнения',
      'Invalid': 'Неверный формат',
      'Missing': 'Отсутствует',
      'Duplicate': 'Дубликат',
      'Expired': 'Истек срок действия',
      'Malformed': 'Неправильный формат',
      'Error:': 'Ошибка:',
      'at Object.': 'в функции ',
      'at processTicksAndRejections': 'в процессе выполнения',
      '// Object.is equality': '// Проверка равенства значений'
    }

    Object.entries(translations).forEach(([en, ru]) => {
      translatedMessage = translatedMessage.replace(new RegExp(en, 'g'), ru)
    })

    return translatedMessage
  }
}

module.exports = RussianReporter
