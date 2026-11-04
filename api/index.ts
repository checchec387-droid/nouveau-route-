import express from 'express';
import cookieParser from 'cookie-parser';
import { apiRouter } from '../server/api';

const app = express();

app.use(express.json());
app.use(cookieParser());

// Mount apiRouter under /api (as requested) and as fallback to handle any rewrite variations
app.use('/api', apiRouter);
app.use(apiRouter);

export default app;
