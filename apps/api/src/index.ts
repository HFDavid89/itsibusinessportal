/**
 * Itsi Business API
 *
 * RULE: Itsi Business owns the business customer.
 *       Itsi Mobile owns the wholesale/provider fulfilment.
 *
 * This API does NOT integrate directly with Gamma, KCOM, MS3, or OTS Hero.
 * All provider interactions are proxied via the Itsi Mobile wholesale API.
 */
import Fastify from 'fastify';
import { logger } from '@itsi-business/core';
import { registerSecurity } from './middleware/security';
import { healthRoutes } from './routes/health';
import { authRoutes } from './routes/auth';
import { accountRoutes } from './routes/accounts';
import { siteRoutes } from './routes/sites';
import { contactRoutes } from './routes/contacts';
import { ticketRoutes } from './routes/tickets';
import { invoiceRoutes } from './routes/invoices';
import { serviceRoutes } from './routes/services';
import { wholesaleRoutes } from './routes/wholesale';

const PORT = parseInt(process.env.PORT ?? '4001', 10);
const HOST = process.env.HOST ?? '0.0.0.0';

const app = Fastify({ logger: false });

async function start() {
  await registerSecurity(app);

  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(accountRoutes, { prefix: '/api/v1/accounts' });
  await app.register(siteRoutes, { prefix: '/api/v1/sites' });
  await app.register(contactRoutes, { prefix: '/api/v1/contacts' });
  await app.register(ticketRoutes, { prefix: '/api/v1/tickets' });
  await app.register(invoiceRoutes, { prefix: '/api/v1/invoices' });
  await app.register(serviceRoutes, { prefix: '/api/v1/services' });
  await app.register(wholesaleRoutes, { prefix: '/api/v1/wholesale' });

  try {
    await app.listen({ port: PORT, host: HOST });
    logger.info('Itsi Business API started', { port: PORT });
  } catch (err) {
    logger.error('Failed to start API', { error: String(err) });
    process.exit(1);
  }
}

start();
