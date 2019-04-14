/*

	Collection of send functions: api + models

*/
const config = require("./config");
const models = require("./models");
const api = require("./api");

const send = {
	read_receipt: psid => {
		api.messages(models.requests.action(psid, config.ACTION.MARK_SEEN));
	},
	typing_on: psid => {
		api.messages(models.requests.action(psid, config.ACTION.TYPING));
	},
	typing_off: psid => {
		api.messages(models.requests.action(psid, config.ACTION.DONE));
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
	generic: (psid, elements, sharable = false, type = config.MESSAGE.RESPONSE) => {
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
	list: (psid, items, button = null, size = config.SIZE.LARGE, sharable = false, type = config.MESSAGE.RESPONSE) => {
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
	buttons: (psid, text, buttons, type = config.MESSAGE.RESPONSE) => {
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
	},
	yes_no: (psid, text) => send.buttons(psid, text, [
		models.buttons.postback("Yep", config.POSTBACKS.YES),
		models.buttons.postback("Nope", config.POSTBACKS.NO)
	])
};

exports.read_receipt = send.read_receipt;
exports.typing_on = send.typing_on;
exports.typing_off = send.typing_off;
exports.text = send.text;
exports.quick_reply = send.quick_reply;
exports.attachment = send.attachment;
exports.generic = send.generic;
exports.list = send.list;
exports.buttons = send.buttons;
exports.yes_no = send.yes_no;
