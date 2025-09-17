const fetch = require('node-fetch')

async function testAdminLogin() {
  try {
    console.log('🔍 Тестируем вход админа через API...')
    
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@crm.com',
        password: '123456'
      })
    })
    
    console.log(`📡 Статус ответа: ${response.status}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Успешный вход!')
      console.log(`   Email: ${data.user.email}`)
      console.log(`   Имя: ${data.user.name}`)
      console.log(`   Роль: ${data.user.role}`)
      console.log(`   Токен: ${data.token ? '✅ Получен' : '❌ Не получен'}`)
    } else {
      const error = await response.text()
      console.log('❌ Ошибка входа:')
      console.log(`   Статус: ${response.status}`)
      console.log(`   Сообщение: ${error}`)
      
      // Попробуем получить JSON ошибку
      try {
        const errorJson = await response.json()
        console.log(`   JSON ошибка:`, errorJson)
      } catch (e) {
        console.log(`   Текст ошибки: ${error}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании API:', error.message)
  }
}

testAdminLogin()
