const https = require('https');
const http = require('http');

function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testLogin() {
  try {
    console.log('🧪 Тестируем API логин...\n');

    const loginData = {
      email: 'admin@crm.com',
      password: 'admin123'
    };

    const response = await makeRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData)
    });

    console.log('Статус ответа:', response.status);
    console.log('Данные ответа:', JSON.stringify(response.data, null, 2));

    if (response.status === 200 && response.data.token) {
      console.log('\n✅ Логин успешен!');
      
      // Тестируем получение учеников
      console.log('\n🧪 Тестируем получение учеников...');
      
      const studentsResponse = await makeRequest('http://localhost:3000/api/students', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${response.data.token}`,
          'Content-Type': 'application/json',
        }
      });

      console.log('Статус ответа учеников:', studentsResponse.status);
      if (studentsResponse.status === 200) {
        console.log(`✅ Получено учеников: ${studentsResponse.data.length}`);
      } else {
        console.log('❌ Ошибка получения учеников:', studentsResponse.data);
      }
    } else {
      console.log('❌ Ошибка логина:', response.data);
    }

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
  }
}

testLogin();
