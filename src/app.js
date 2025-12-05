import express from 'express';
import morgan from 'morgan';

import { notFound, errorHandler } from './middleware/error.middleware.js';


import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';

const app = express();


app.use(express.json());
app.use(morgan('dev'));


app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});


app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);


app.use(notFound);
app.use(errorHandler);

export default app;
