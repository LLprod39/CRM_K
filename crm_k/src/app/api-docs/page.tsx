'use client';

import { useEffect, useState } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function ApiDocsPage() {
  const [swaggerSpec, setSwaggerSpec] = useState(null);

  useEffect(() => {
    // Загружаем спецификацию Swagger
    fetch('/api/swagger')
      .then(response => response.json())
      .then(data => setSwaggerSpec(data))
      .catch(error => console.error('Ошибка загрузки Swagger:', error));
  }, []);

  if (!swaggerSpec) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка документации API...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            API Документация
          </h1>
          <p className="text-gray-600">
            Интерактивная документация для CRM API
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <SwaggerUI 
            spec={swaggerSpec}
            docExpansion="list"
            defaultModelsExpandDepth={2}
            defaultModelExpandDepth={2}
            tryItOutEnabled={true}
            supportedSubmitMethods={['get', 'post', 'put', 'delete', 'patch']}
          />
        </div>
      </div>
    </div>
  );
}

