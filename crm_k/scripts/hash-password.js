const bcrypt = require('bcryptjs');

async function hashPassword() {
  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 12);
  console.log('Хеш пароля:', hashedPassword);
}

hashPassword();
