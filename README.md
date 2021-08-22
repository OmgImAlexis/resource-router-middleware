# resource-router-middleware

> Express REST resources as middleware, mountable anywhere.


## Installation

```console
npm i github:OmgImAlexis/resource-router-middleware
```

## Usage

```js
import resource from 'resource-router-middleware';

export default resource({
	
	mergeParams: true,
	
	id : 'user',

	load(req, id, callback) {
		var user = users.find( user => user.id===id ),
			err = user ? null : 'Not found';
		callback(err, user);
	},

	list({ params }, res) {
		res.json(users);
	},

	create({ body }, res) {
		body.id = users.length.toString(36);
		users.push(body);
		res.json(body);
	},

	read({ user }, res) {
		res.json(user);
	},

	update({ user, body }, res) {
		for (let key in body) {
			if (key!=='id') {
				user[key] = body[key];
			}
		}
		res.status(204).send();
	},

	delete({ user }, res) {
		users.splice(users.indexOf(user), 1);
		res.status(204).send();
	}
});
```
