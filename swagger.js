import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "WhatsApp Puppeteer Docs",
      version: "1.0.0",
    },
  },
  apis: ["./routes/*.js"], // Path to the API routes folder
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
