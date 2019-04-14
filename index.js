const express = require("express");
const app = express();
const request = require("request");

const layouts = require('express-ejs-layouts');
const body_parser = require("body-parser");
const cookie_parser = require("cookie-parser");

/*

	B00k1ng B0t

	A messenger chat bot and extension for booking.com

	Graham Robertson & Louisette Baillie

	I can't be arsed dividing this up into different files...

	TODO:
		- Let's make sure it's robust....
		- We'll start on APIs at about 11pm
		- Go through each step and screen via Booking.com APIs.......

*/
const DEV_MODE = true;
const DOMAIN = "https://b00k1ng.com";
const PORT = 3000;
const OK = 200;
const BAD = 403;

const MESSENGER_API = "https://graph.facebook.com/v2.6/me/";
const BOOKING_API = "https://hackaton_team_graham:B00ndock5!@distribution-xml.booking.com/2.0/json/";

const APP_ID = 417588018987362;
const APP_SECRET = "b00k1ng.b0t"
const PAGE_ACCESS_TOKEN = require("./TOKEN.js");
const HOME_URL = DOMAIN + "/group";
const WHITELIST = [DOMAIN];

const DEFAULT = "default";
const SHOW = "show";
const HIDE = "hide";
const ALL = "all";
const SIZE = {
	COMPACT: "compact",
	TALL: "tall",
	FULL: "full",
	LARGE: "large"
};
const POSTBACKS = {
	GET_STARTED: "GET_STARTED",
	YES: "YES",
	NO: "NO",
	TRIPS: "TRIPS",
	HELP: "HELP"
};
const ACTION = {
	MARK_SEEN: "mark_seen",
	TYPING: "typing_on",
	DONE: "typing_off"
};
const MESSAGE = {
	RESPONSE: "RESPONSE",
	UPDATE: "UPDATE",
	SUBSCRIPTION: "MESSAGE_TAG"
};
const ATTACHMENT = {
	AUDIO: "audio",
	VIDEO: "video",
	IMAGE: "image",
	FILE: "file",
	TEMPLATE: "template"
};
const BUTTON = {
	URL: "web_url",
	POSTBACK: "postback",
	SHARE: "element_share",
	NESTED: "nested"
};
const QUICK_REPLY = {
	TEXT: "text"
};
const TEMPLATE = {
	GENERIC: "generic",
	LIST: "list",
	MEDIA: "media",
	BUTTON: "button"
};
const TAG = {
	FEATURE_FUNCTION_UPDATE: "FEATURE_FUNCTION_UPDATE",
	RESERVATION_UPDATE: "RESERVATION_UPDATE",
	PERSONAL_FINANCE_UPDATE: "PERSONAL_FINANCE_UPDATE",
	PAYMENT_UPDATE: "PAYMENT_UPDATE",
	NON_PROMOTIONAL_SUBSCRIPTION: "NON_PROMOTIONAL_SUBSCRIPTION"
};

const SCRIPTS = {
	WELCOME_TITLE: "Hi I'm b00k1ng b0t 🤖️",
	WELCOME_MESSAGE: "I'm here to help you plan a trip! 🏖️\
	I'm especially helpful if you're travelling with a group.\
	Making decisions will be super easy when you share your trip in you and your friends' group chat.\n\n",
	WHERE_ARE_YOU_GOING: "Where are you going? Simply reply with a city name 🧐️",
	WHEN_ARE_YOU_GOING: "Phew. Glad I got that one right.\
	When are you going?\
	(eg. from 27 October to 31 October, Sep 1st until Sep 8th, etc...)"
};


// Makes an array if item isn't one.
const ARRAY = item => [].concat(item);
const URL = path => DOMAIN + path;

/*

	Data Structures for APIs

*/
const models = {
	profile: {
		config: (greeting, menu) => {
			return {
				persistent_menu: ARRAY(menu),
				greeting: [{
					locale: DEFAULT,
					text: greeting
				}],
				get_started: {
					payload: POSTBACKS.GET_STARTED
				},
				home_url: {
					url: HOME_URL,
					webview_height_ratio: SIZE.TALL,
					//webview_share_button: SHOW,
					in_test: DEV_MODE
				},
				whitelisted_domains: WHITELIST,
				target_audience: {
					audience_type: ALL
				}
			};
		},
		menu: buttons => {
			return {
				call_to_actions: buttons,
				locale: DEFAULT,
				disabled_surfaces: "customer_chat_plugin"
			};
		}
	},
	buttons: {
		submenu: (label, buttons) => {
			return {
				title: label,
				type: BUTTON.NESTED,
				call_to_actions: buttons
			};
		},
		menu: (label, url, size = SIZE.TALL) => {
			return {
				title: label,
				type: BUTTON.URL,
				url: url,
				webview_height_ratio: size,
				messenger_extensions: true
			};
		},
		click: (url, size = SIZE.TALL, share = false) => {
			return {
				type: BUTTON.URL,
				url: url,
				webview_height_ratio: size,
				messenger_extensions: true,
				webview_share_button: share
			}
		},
		url: (label, url, size = SIZE.TALL, share = false) => {
			return Object.assign(
				models.buttons.menu(label, url, size),
				{
					webview_share_button: share
				}
			);
		},
		postback: (label, payload) => {
			return {
				title: label,
				type: BUTTON.POSTBACK,
				payload: payload
			};
		},
		share: () => {
			return {
				type: BUTTON.SHARE
			}
		}
	},

	requests: {
		action: (psid, action = ACTION.DONE) => {
			return {
				messaging_type: MESSAGE.UPDATE,
				recipient: {
					id: psid
				},
				sender_action: action
			};
		},
		message: (psid, message, type = MESSAGE.RESPONSE) => {
			return Object.assign({
				messaging_type: type,
				recipient: {
					id: psid
				},
				message: message || {
					text: "Hello. I wasn't told what to say to you."
				}
			});
		},
		subscription: (psid, message, tag = TAG.NON_PROMOTIONAL_SUBSCRIPTION) => {
			return Object.assign(models.requests.message(psid, message, MESSAGE.SUBSCRIPTION), {
				tag: tag
			});
		},
		upload: (url, type = ATTACHMENT.IMAGE) => {
			return {
				message: {
					attachment: models.attachment(
						models.payloads.attachment(url, true),
						type
					)
				}
			}
		}
	},

	message: (text, attachment, quick_replies) => {
		if (!text && !attachment)
			console.error("ERROR: At least some text or an attachment must be provided.");
		
		let o = {};

		if (text) {
			Object.assign(o, {
				text: text
			});
		}
		if (attachment) {
			Object.assign(o, {
				attachment: attachment
			});
		}
		if (quick_replies) {
			Object.assign(o, {
				quick_replies: quick_replies
			});
		}

		return o;
	},

	quick_reply: (label, postback, icon) => {
		return Object.assign({
			content_type: QUICK_REPLY.TEXT,
			title: label,
			payload: postback || label,
		}, icon ? {
			image_url: icon
		} : {});
	},

	attachment: (payload, type = ATTACHMENT.IMAGE) => {
		return {
			type: type,
			payload: payload
		}
	},

	template: payload => models.attachment(payload, ATTACHMENT.TEMPLATE),

	payloads: {
		attachment: (url, is_asset = false) => {
			return {
				url: url,
				is_reusable: is_asset
			}
		},
		template: (elements, sharable = true, type = TEMPLATE.GENERIC) => {
			return {
				template_type: type,
				sharable: sharable,
				elements: ARRAY(elements)
			};
		},
		generic: (elements, sharable) => models.payloads.template(elements, sharable),
		list: (elements, button, size = SIZE.LARGE, sharable = false) => {
			if (elements.length < 2 || elements.length > 4)
				return console.error("ERROR: Lists can only have 2 - 4 items.");
			
			return Object.assign(
				models.payloads.template(elements, sharable, TEMPLATE.LIST),
				{
					top_element_style: size,
					buttons: ARRAY(button)
				}
			);
		},
		media: (element, sharable) => models.payloads.template(ARRAY(element), sharable, TEMPLATE.MEDIA),
		buttons: (text, buttons) => {
			if (buttons.length > 3)
				return console.error("ERROR: Nae mer than three buttons!");
			return {
				template_type: TEMPLATE.BUTTON,
				text: text,
				buttons: buttons
			};
		}
	},
	
	elements: {
		element: (title, subtitle, image_url, click, buttons) => {
			let o = {
				title: title,
				subtitle: subtitle,
			};
			if (image_url) {
				Object.assign(o, {
					image_url: image_url
				});
			}
			if (click) {
				Object.assign(o, {
					default_action: click
				});
			}
			if (buttons) {
				Object.assign(o, {
					buttons: buttons
				});
			}
			return o;
		},
		generic: (title, subtitle, image, click, buttons) => {
			if (buttons && buttons.length > 3)
				return console.error("ERROR: Can only have at most 3 buttons.");
			return models.elements.element(title, subtitle, image, click, buttons);
		},
		list_item: (title, subtitle, image, click, button) => {
			return models.elements.element(title, subtitle, image, click, button ? ARRAY(button) : undefined);
		},
		media: (attachment_id, button, type = ATTACHMENT.VIDEO) => {
			let o = {
				media_type: type,
				attachment_id: attachment_id
			};
			if (button) {
				Object.assign(o, {
					buttons: ARRAY(button)
				});
			}
			return o;
		}
	},


};


/*

	Collection of API endpoints

*/
const api = {
	_: (uri, params, data, success, failure) => {
		request({
			uri: uri,
			qs: params || {},
			method: data ? "POST" : "GET",
			json: data
		}, (err, res, body) => {
			if (!err && res.statusCode === OK)
				success && success(res, body);
			else if (failure)
				failure(res, body);
			else
				console.error("API ERROR:", res.statusCode, res.statusMessage, body.error, params);
		});
	},
	booking: (end_point, params, success) => {
		api._(
			BOOKING_API + end_point,
			params,
			null,
			(res, body) => success(res, JSON.parse(body))
		);
	},
	autocomplete: (text, success) => {
		api.booking("autocomplete", {
			text: text,
			language: "en",
			extras: "forecast"
		}, success);
	},
	messenger: (end_point, params, data) => {
		api._(
			MESSENGER_API + end_point,
			Object.assign({
				access_token: PAGE_ACCESS_TOKEN
			}, params),
			data
		);
	},
	// TODO: batch messaging.
	messages: (message, params = {}) => api.messenger("messages", params, message),
	profile: (profile, params = {}) => api.messenger("messenger_profile", params, profile),
	upload: (attachment, params = {}) => api.messenger("message_attachments", params, attachment)
};


/*

	Collection of send functions: api + models

*/
const send = {
	read_receipt: psid => {
		api.messages(models.requests.action(psid, ACTION.MARK_SEEN));
	},
	typing_on: psid => {
		api.messages(models.requests.action(psid, ACTION.TYPING));
	},
	typing_off: psid => {
		api.messages(models.requests.action(psid, ACTION.DONE));
	},
	message: (psid, message, type) => {
		api.messages(models.requests.message(psid, message, type));
	},
	text: (psid, text) => {
		send.message(psid, models.message(text));
	},
	quick_reply: (psid, text, quick_replies) => {
		console.log("SENDING QUICK REPLY:", psid, text);
		console.dir(
			models.requests.message(psid, models.message(text, null, quick_replies))
		);
		send.message(psid, models.message(text, null, quick_replies));
	},
	attachment: (psid, attachment, text) => {
		console.log("SENDING ATTACHMENT:", psid, attachment.type, text);
		send.message(psid, models.message(text, attachment));
	},
	generic: (psid, elements, sharable = false, type = MESSAGE.RESPONSE) => {
		send.message(
			psid,
			models.message(
				null,
				models.template(models.payloads.generic(
					elements,
					sharable
				))
			),
			type
		);
	},
	list: (psid, items, button = null, size = SIZE.LARGE, sharable = false, type = MESSAGE.RESPONSE) => {
		send.message(
			psid,
			models.message(
				null,
				models.template(models.payloads.list(
					items,
					button,
					size,
					sharable
				))
			),
			type
		);
	},
	buttons: (psid, text, buttons, type = MESSAGE.RESPONSE) => {
		send.message(
			psid,
			models.message(
				null,
				models.template(models.payloads.buttons(
					text,
					buttons
				))
			),
			type
		);
	}
};

// We should create a Proxy for states... which listeners are present is variable.
let _started = false;
const state = {
	default: {
		[POSTBACKS.GET_STARTED]: psid => {
			// TODO: Batch messages...
			send.typing_on(psid);
			
			if (!_started) {
				_started = true;
				send.generic(psid, models.elements.generic(
					SCRIPTS.WELCOME_TITLE,
					"Let's get started!" // What about this?
				)); // we need like a .then something.....
			}
			setTimeout(() => {
				send.text(psid, SCRIPTS.WHERE_ARE_YOU_GOING);
			}, 1500);

			return state.city_search;
		},
		message: (psid, message) => {
			send.text(psid, "Calm down.");
			return state.default;
		}
	},
	city_search: {
		[POSTBACKS.YES]: psid => {
			send.typing_on(psid);
			setTimeout(() => {
				send.text(psid, SCRIPTS.WHEN_ARE_YOU_GOING);
			}, 1000);
			return state.travel_dates;
		},
		[POSTBACKS.NO]: psid => {
			send.text(psid, "Nae bother. Gi'it another wee go.");
			return state.city_search;
		},
		message: (psid, message) => {
			send.typing_on(psid);
			send.text(psid, "🔎️ Searching... bee-boo-bop");

			api.autocomplete(message.text, (res, data) => {
				let result = data.result[0];

				send.generic(psid, models.elements.generic(
					result.label,
					`Low: ${result.forecast.min_temp_c}ºC - High: ${result.forecast.max_temp_c}ºC`,
					// TODO: Need to fetch a photo from somewhere...
					"http://www.libertasinternational.com/wp-content/uploads/2014/02/amsterdam3.jpg"
				));
				setTimeout(() => {
					send.buttons(psid, "Is this the right place?", [
						models.buttons.postback("Yep", POSTBACKS.YES),
						models.buttons.postback("Nope", POSTBACKS.NO)
					]);
				}, 1000);
			});

			return state.city_search;
		}
	},
	travel_dates: {
		message: (psid, message) => {
			console.log("DEEP DIVE BRUH...");
			console.dir(message);
			send.text(psid, JSON.stringify(message));
			return state.travel_dates;
		}
	}
};

const receive = {
	_state: state.default,
	message: event => {
		let psid = event.sender.id;
		let message = event.message;

		console.log("========================================");
		console.log("RECEIVED MESSAGE:", psid);
		console.dir(message);
		console.log("========================================");

		send.read_receipt(psid);
		setTimeout(() => receive._state = receive._state.message(psid, message), 1000);
	},
	postback: event => {
		let psid = event.sender.id;
		let payload = event.postback.payload;

		console.log("========================================");
		console.log("RECEIVED POSTBACK:", psid, payload);
		console.log("========================================");

		send.read_receipt(psid);
		setTimeout(() => receive._state = receive._state[payload](psid), 1000);
	}
};


/*

	Hook everything together!!

*/
if (DEV_MODE) {
	app.use('/css', express.static(__dirname + '/css'));
	app.use('/assets', express.static(__dirname + '/assets'));
}

app.use(layouts);
app.use(body_parser.json());
app.use(body_parser.urlencoded({
	extended: false
}));
app.use(cookie_parser());
app.set("view engine", "ejs");


app.get('/', (req, res) => {
	res.render("index");
});

app.get('/trips', (req, res) => {
	res.render("trips");
});

app.get('/help', (req, res) => {
	res.render("help");
});

// TODO: Group chat.
app.get('/group', (req, res) => {
	res.send("Group chat extension.");
});

// We should make a wee API for testing these messages.
app.route("/webhook")
	.get((req, res) => {
		let mode = req.query['hub.mode'];
		let token = req.query['hub.verify_token'];
		let challenge = req.query['hub.challenge'];

		if (mode && token) {
			if (mode === 'subscribe' && token === APP_SECRET) {
				console.log("VERIFIED: Webhook", APP_SECRET);
				res.status(OK).send(challenge);
			}
		} else {
			console.error("FAILED. Webhook did not validate.");
			res.status(BAD).send("Bad Request.");
		}
	})
	.post((req, res) => {
		res.sendStatus(OK);

		const data = req.body;
		
		if (data.object === "page") {

			//console.log("MESSAGE RECEIVED:", JSON.stringify(data));

			data.entry.forEach(entry => {
				if (!entry.messaging)
					return;
				
				entry.messaging.forEach(event => {
					if (event.message)
						receive.message(event);
					else if (event.postback)
						receive.postback(event);
					else
						console.error("UNKNOWN EVENT:", event);
				});
			});
		}
	});

if (DEV_MODE) {
	api.profile(models.profile.config(
		SCRIPTS.WELCOME_TITLE + "\n\n" + SCRIPTS.WELCOME_MESSAGE,
		models.profile.menu([
			models.buttons.postback("Get Started", POSTBACKS.GET_STARTED),
			models.buttons.menu("My Trips", URL("/trips")),
			models.buttons.menu("Help", URL("/help"))
		])
	));
}

app.listen(PORT, () => {
	console.log("b00k1ng b0t - ONLINE.");
	console.log(PAGE_ACCESS_TOKEN);
});
