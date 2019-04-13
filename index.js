const express = require("express");
const app = express();
const request = require("request");

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
const BOOKING_API = "https://distribution-xml.booking.com/2.0/json/";

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
	GET_STARTED: "GET_STARTED"
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

	quick_reply: (label, icon, postback) => {
		return {
			content_type: QUICK_REPLY.TEXT,
			title: label,
			image_url: icon,
			payload: postback || label,
		}
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
			return {
				title: title,
				subtitle: subtitle,
				image_url: image_url,
				default_action: click,
				buttons: buttons
			}
		},
		generic: (title, subtitle, image, click, buttons) => {
			if (buttons.length > 3)
				return console.error("ERROR: Can only have at most 3 buttons.");
			return models.elements.element(title, subtitle, image, click, buttons);
		},
		list_item: (title, subtitle, image, click, button) => {
			return models.elements.element(title, subtitle, image, click, ARRAY(button));
		},
		media: (attachment_id, button, type = ATTACHMENT.VIDEO) => {
			return {
				media_type: type,
				attachment_id: attachment_id,
				buttons: ARRAY(button)
			};
		}
	},


};


/*

	Collection of API endpoints

*/
const api = {
	_: (uri, params, data, success, failure) => {
		console.log(uri);
		request({
			uri: uri,
			qs: params || {},
			method: "POST",
			json: data || {}
		}, (err, res, body) => {
			if (!err && res.statusCode === OK)
				success ? success(res, body) : console.log("API SUCCESS:", body);
			else
				failure ? failure(res, body) : console.error("API ERROR:", res.statusCode, res.statusMessage, body.error, params);
		});
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
		console.log("MESSAGE READ.", psid);
		api.messages(models.requests.action(psid, ACTION.MARK_SEEN));
	},
	typing_on: psid => {
		console.log("TYPING...", psid);
		api.messages(models.requests.action(psid, ACTION.TYPING));
	},
	typing_off: psid => {
		console.log("DONE TYPING.", psid);
		api.messages(models.requests.action(psid, ACTION.DONE));
	},
	message: (psid, message, type) => {
		api.messages(models.requests.message(psid, message, type));
	},
	text: (psid, text) => {
		console.log("SENDING TEXT:", psid, text);
		send.message(psid, models.message(text));
	},
	quick_reply: (psid, text, quick_replies) => {
		console.log("SENDING QUICK REPLY:", psid, text);
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
	}
};

const receive = {
	message: event => {
		let psid = event.sender.id;
		let message = event.message;
		console.log("RECEIVED MESSAGE:", psid, message);

		send.read_receipt(psid);
	},
	postback: event => {
		let psid = event.sender.id;
		let data = event.postback.payload;

		console.log(psid, data);

		send.read_receipt(psid)
		// DO SOMETHING WITH THE POSTBACK... USUALLY YOU GOTTA SEND SOMETHIN'
	}
};


/*

	Hook everything together!!

*/
app.use(body_parser.json());
app.use(body_parser.urlencoded({
	extended: false
}));
app.use(cookie_parser());
app.set("view engine", "ejs");


app.get('/', (req, res) => {
	res.send("Hello, World.");
});

app.get('/trips', (req, res) => {
	res.send("Trips.");
});

app.get('/help', (req, res) => {
	res.send("Help Page.");
});

app.get('/group', (req, res) => {
	res.send("Group chat extension.");
});

// We should make a wee API for testing these messages.
app.route("/webhook")
	.get((req, res) => {
		let mode = req.query['hub.mode'];
		let token = req.query['hub.verify_token'];
		let challenge = req.query['hub.challenge'];

		console.log("VERIFY:", mode, token, challenge);

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
			console.log("MESSAGE RECEIVED:", JSON.stringify(data));

			data.entry.forEach(entry => {
				if (!entry.messaging)
					return;
				
				entry.messaging.forEach(event => {
					console.log({event});

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

api.profile(models.profile.config(
	"Howdy! I'm B00k1ng B0t and I'll help you book through Booking.com for your next trip. Let's get started!",
	models.profile.menu([
		models.buttons.postback("Get Started", POSTBACKS.GET_STARTED),
		models.buttons.menu("My Trips", URL("/trips")),
		models.buttons.menu("Help", URL("/help"))
	])
));

app.listen(PORT, () => {
	console.log("b00k1ng b0t - ONLINE.");
	console.log(PAGE_ACCESS_TOKEN);
});
