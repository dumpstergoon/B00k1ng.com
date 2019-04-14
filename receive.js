const send = require("./send");
const state = require("./state");

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
		setTimeout(() => {
			receive._state = receive._state[payload] ? receive._state[payload](psid) : state.default[payload](psid);
		}, 1000);
	}
};

exports.message = receive.message;
exports.postback = receive.postback;
