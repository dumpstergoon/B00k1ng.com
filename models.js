const config = require("./config");
const ARRAY = item => [].concat(item);

	exports.profile = {
		config: (greeting, menu) => {
			return {
				persistent_menu: ARRAY(menu),
				greeting: [{
					locale: config.DEFAULT,
					text: greeting
				}],
				get_started: {
					payload: config.POSTBACKS.GET_STARTED
				},
				home_url: {
					url: config.HOME_URL,
					webview_height_ratio: config.SIZE.TALL,
					//webview_share_button: SHOW,
					in_test:config.DEV_MODE
				},
				whitelisted_domains: config.WHITELIST,
				target_audience: {
					audience_type: config.ALL
				}
			};
		},
		menu: buttons => {
			return {
				call_to_actions: buttons,
				locale: config.DEFAULT,
				disabled_surfaces: "customer_chat_plugin"
			};
		}
	},
	exports.buttons = {
		submenu: (label, buttons) => {
			return {
				title: label,
				type: config.BUTTON.NESTED,
				call_to_actions: buttons
			};
		},
		menu: (label, url, size = config.SIZE.TALL) => {
			return {
				title: label,
				type: config.BUTTON.URL,
				url: url,
				webview_height_ratio: size,
				messenger_extensions: true
			};
		},
		click: (url, size = config.SIZE.TALL, share = config.HIDE) => {
			return {
				type: config.BUTTON.URL,
				url: url,
				webview_height_ratio: size,
				messenger_extensions: true,
				webview_share_button: share
			}
		},
		url: (label, url, size = config.SIZE.TALL, share = config.HIDE) => {
			return Object.assign(
				exports.buttons.menu(label, url, size),
				{
					webview_share_button: share
				}
			);
		},
		postback: (label, payload) => {
			return {
				title: label,
				type: config.BUTTON.POSTBACK,
				payload: payload
			};
		},
		share: () => {
			return {
				type: config.BUTTON.SHARE
			}
		}
	},

	exports.requests = {
		action: (psid, action = config.ACTION.DONE) => {
			return {
				messaging_type: config.MESSAGE.UPDATE,
				recipient: {
					id: psid
				},
				sender_action: action
			};
		},
		message: (psid, message, type = config.MESSAGE.RESPONSE) => {
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
		subscription: (psid, message, tag = config.TAG.NON_PROMOTIONAL_SUBSCRIPTION) => {
			return Object.assign(exports.requests.message(psid, message, config.MESSAGE.SUBSCRIPTION), {
				tag: tag
			});
		},
		upload: (url, type = config.ATTACHMENT.IMAGE) => {
			return {
				message: {
					attachment: exports.attachment(
						exports.payloads.attachment(url, true),
						type
					)
				}
			}
		}
	},

	exports.message = (text, attachment, quick_replies) => {
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

	exports.quick_reply = (label, postback, icon) => {
		return Object.assign({
			content_type: config.QUICK_REPLY.TEXT,
			title: label,
			payload: postback || label,
		}, icon ? {
			image_url: icon
		} : {});
	},

	exports.attachment = (payload, type = config.ATTACHMENT.IMAGE) => {
		return {
			type: type,
			payload: payload
		}
	},

	exports.template = payload => exports.attachment(payload, config.ATTACHMENT.TEMPLATE),

	exports.payloads = {
		attachment: (url, is_asset = false) => {
			return {
				url: url,
				is_reusable: is_asset
			}
		},
		template: (elements, sharable = true, type = config.TEMPLATE.GENERIC) => {
			return {
				template_type: type,
				sharable: sharable,
				elements: ARRAY(elements)
			};
		},
		generic: (elements, sharable) => exports.payloads.template(elements, sharable),
		list: (elements, button, size = config.SIZE.LARGE, sharable = false) => {
			if (elements.length < 2 || elements.length > 4)
				return console.error("ERROR: Lists can only have 2 - 4 items.");
			
			return Object.assign(
				exports.payloads.template(elements, sharable, config.TEMPLATE.LIST),
				{
					top_element_style: size,
					buttons: ARRAY(button)
				}
			);
		},
		media: (element, sharable) => exports.payloads.template(ARRAY(element), sharable, config.TEMPLATE.MEDIA),
		buttons: (text, buttons) => {
			if (buttons.length > 3)
				return console.error("ERROR: Nae mer than three buttons!");
			return {
				template_type: config.TEMPLATE.BUTTON,
				text: text,
				buttons: buttons
			};
		}
	},
	
	exports.elements = {
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
			return exports.elements.element(title, subtitle, image, click, buttons);
		},
		list_item: (title, subtitle, image, click, button) => {
			return exports.elements.element(title, subtitle, image, click, button ? ARRAY(button) : undefined);
		},
		media: (attachment_id, button, type = config.ATTACHMENT.VIDEO) => {
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
	};
