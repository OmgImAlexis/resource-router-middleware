import { randomUUID } from 'crypto';
import express from 'express';
// import { createRouter } from 'resource-router-middleware';
import { createRouter } from '../src/resource-router-middleware';

interface User {
    id: string;
    data: unknown;
}

const users: User[] = [{ id: '1000', data: 'abc123' }];

const db = {
	create(data: unknown) {
        const id = randomUUID();
		const user = { id, data };
		users.push(user);
		return user;
	},
	get(id?: string) {
		return id ? users.find(item => item.id === id) : users;
	},
	update(id: string, data: unknown) {
		const userIndex = users.findIndex(user => user.id === id);
		if (users[userIndex]) users[userIndex].data = data;
	},
	delete(id: string) {
		delete users[users.findIndex(item => item.id === id)];
	}
};

const app = express();

app.use('/', createRouter({
	id: 'userId',
	middleware: (req, res, next) => {
		if (req.path === '/middleware-test') {
			res.status(200).send('middleware-loaded');
			return;
		}
		next();
	},
	load(_req, id) {
		return db.get(id);
	},
	list(_req, res) {
		const data = db.get();
		res.status(200).json(data);
	},
	create(req, res) {
		const user = db.create(req.body.data);
		res.status(201).json(user);
	},
	read(req, res) {
		const user = req.data[req.params[this.id]];
		if (!user) {
			res.sendStatus(404);
			return;
		}
		res.status(200).json(user);
	},
	update(req, res) {
		if (req.params[this.id] === '1000') {
			res.sendStatus(204);
			return;
		}
		res.sendStatus(201);
	},
	delete(req, res) {
		const id = req.params[this.id];
		if (db.get(id) === undefined) throw new Error(`No user found in DB with id ${id}`);

		db.delete(id);
		res.sendStatus(204);
	}
}));

const port = process.env.PORT ?? 0;
const listener = app.listen(port, () => {
    const address = listener.address();
    const binding = typeof address === 'string' ? `pipe/socket ${address}` : `port ${address.port}`;
    console.info('Server is listening on %s', binding);
});