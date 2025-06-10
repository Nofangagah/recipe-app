import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Recipe API Documentation',
      version: '1.0.0',
      description: 'API documentation for the Recipe Application',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Development server',
      },
      {
        url: 'https://recipe-130852023885.us-central1.run.app',
        description: 'Production server',
      },
    ],
    
  },
  apis: ['./controller/*.js'], 
};

const specs = swaggerJsdoc(options);


export default (app) => {
 
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

  
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};