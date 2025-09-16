import SwaggerJSDoc from 'swagger-jsdoc';

const options: SwaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CRM API',
      version: '1.0.0',
      description: 'API документация для CRM системы',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        LoginData: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Email пользователя',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              description: 'Пароль пользователя',
              example: 'password123',
            },
          },
        },
        AuthUser: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID пользователя',
              example: 1,
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email пользователя',
              example: 'user@example.com',
            },
            name: {
              type: 'string',
              description: 'Имя пользователя',
              example: 'Иван Иванов',
            },
            role: {
              type: 'string',
              enum: ['ADMIN', 'USER'],
              description: 'Роль пользователя',
              example: 'ADMIN',
            },
            token: {
              type: 'string',
              description: 'JWT токен для аутентификации',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Описание ошибки',
              example: 'Неверный email или пароль',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/app/api/**/*.ts'], // Путь к файлам API
};

export const swaggerSpec = SwaggerJSDoc(options);

