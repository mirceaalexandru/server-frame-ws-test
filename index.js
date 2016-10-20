"use strict";

const Async = require('async');
const Nes = require('nes');
const Wreck = require('wreck');
const users = [
	{
		username: "admin",
		password: "ccccccccc"
	},
	{
		username: "admin2",
		password: "11111111"
	}
]

Async.each(users, testUser, () => {
})

function testUser(user, done) {
	const Client = new Nes.Client("ws://localhost:9090");

	Wreck.request(
		"POST",
		"http://localhost:9090/login",
		{
			payload: {
				username: user.username,
				password: user.password
			}
		}, (err, res) => {
			if (err) {
				console.log(user.username + ': Error connecting to server: ', err);
				return done();
			}

			if (res.statusCode != 200) {
				console.log(user.username + ': Error authenticating to server: ', res.statusCode);
				return done();
			}

			let cookie = res.headers['set-cookie'][0];
			cookie = cookie.match(/(?:[^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)\s*=\s*(?:([^\x00-\x20\"\,\;\\\x7F]*))/)[1];

			Client.connect({auth: {headers: {cookie: 'sid=' + cookie}}}, function (err) {
				if (err) {
					console.log(user.username + ': Error connecting ws to server: ', err);
					return done();
				}

				Client.subscribe(
					'/job/progress',
					(message) => {
						console.log(user.username + ' received a message: ', message);
					},
					err => {
						if (err) {
							console.log(user.username + ': cb err: ', err);
							return done();
						}
					}
				);
				Client.request('/ping', function (err) {
					if (err) {
						console.log(user.username + ': Error ping: ', err);
						return done();
					}

					Client.request(
						{
							method: 'POST',
							path: '/service/ok'
						}, function (err) {
							if (err) {
								console.log(user.username + ': Error service: ', err);
								return done();
							}

							console.log(user.username + ': All seems OK');
							return done();
						});
				});
			});
		});
}
