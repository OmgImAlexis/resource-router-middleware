import ava, { TestInterface } from 'ava'; // AVA 3
import express, { Express } from 'express';
import supertest from 'supertest';
import { createRouter } from '../src/resource-router-middleware';

const test = ava as TestInterface<{ app: Express; }>;

test.beforeEach(t => {
    const app = express();

    const data = [{ id: '1000', data: 'abc123' }];
    const db = {
        delete(id: string) {
            delete data[data.findIndex(item => item.id === id)];
        },
        get(id?: string) {
            return id ? data.find(item => item.id === id) : data;
        }
    };

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
            res.status(200).send(data);
        },
        create(_req, res) {
            res.sendStatus(201);
        },
        read(req, res) {
            res.status(200).send(JSON.stringify(req.data[req.params[this.id]]));
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
            if (db.get(id) === undefined) {
                throw new Error(`No item found in DB with id ${id}`);
            }

            db.delete(id);
            res.sendStatus(204);
        }
    }));

    t.context.app = app;
});

test('Create responds with 201' , async  t => {
    const result = await supertest(t.context.app).post('/');
    t.is(result.statusCode, 201);
});

test('Read responds with 200' , async  t => {
    const result = await supertest(t.context.app).get('/');
    t.is(result.statusCode, 200);
});

test('Update responds with 404' , async  t => {
    const result = await supertest(t.context.app).put('/');
    t.is(result.statusCode, 404);
});

test('Delete responds with 404' , async  t => {
    const result = await supertest(t.context.app).delete('/');
    t.is(result.statusCode, 404);
});

test('GET /1000 respond with 200' , async  t => {
    const result = await supertest(t.context.app).get('/1000');
    t.is(result.statusCode, 200);
    t.is(result.text, JSON.stringify({ id: '1000', data: 'abc123' }));
});

test('Create /1000 respond with 404' , async  t => {
    const result = await supertest(t.context.app).post('/1000');
    t.is(result.statusCode, 404);
});

test('Update /1000 respond with 204' , async  t => {
    const result = await supertest(t.context.app).put('/1000');
    t.is(result.statusCode, 204);
})

test('Delete /1000 respond with 204' , async  t => {
    const result = await supertest(t.context.app).delete('/1000');
    t.is(result.statusCode, 204);
});

test('Delete /1000 respond with 204 only if the item exists' , async  t => {
    const result = await supertest(t.context.app).delete('/1000');
    t.is(result.statusCode, 204);

    const secondResult = await supertest(t.context.app).delete('/1000');
    t.is(secondResult.statusCode, 500);
});

test('Middleware works' , async  t => {
    const result = await supertest(t.context.app).get('/middleware-test');
    t.is(result.statusCode, 200);
    t.is(result.text, 'middleware-loaded');
});