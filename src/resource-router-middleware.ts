import { Request, RequestHandler, Router as createExpressRouter, RouterOptions } from 'express';

const hasUrlParam = ['read', 'update', 'delete'];
const restMethods = { list: 'get', read: 'get', create: 'post', update: 'put', delete: 'delete' };

interface Route {
	id: string;
	middleware?: RequestHandler;
	load?: (req: Request, id: string) => Promise<unknown> | unknown;
	list?: RequestHandler;
	create?: RequestHandler;
	read?: RequestHandler;
	update?: RequestHandler;
	delete?: RequestHandler;
}

declare global {
    namespace Express {
        interface Request {
            data: Record<string, unknown>;
        }
    }
}

export const createRouter = ({ id, middleware, load, list, create, read, update, delete: remove, ...options }: Route & RouterOptions) => {
	const methods = { list, create, read, update, delete: remove };
	const router = createExpressRouter(options);

	if (middleware) router.use(middleware);

	if (load) {
		router.param(id, async (req, res, next, id: string) => {
			try {
				const data = await Promise.resolve(load(req, id));
				if (!req.data) req.data = {};
				req.data[id] = data;
				next();
			} catch (error: unknown) {
				res.status(500).send(error);
			}
		});
	}

	for (let method in restMethods) {
		const resolvedMethod = restMethods[method as keyof typeof restMethods] as 'get' | 'post' | 'put' | 'delete';
		const url = hasUrlParam.includes(method) ? `/:${id}` : '/';
		const handler = methods[method as keyof typeof methods];
		if (handler) router[resolvedMethod](url, handler.bind({ id }));
	}

	return router;
};
