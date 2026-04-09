from flask import Flask, request
from twilio.twiml.messaging_response import MessagingResponse

app = Flask(__name__)


@app.route("/whatsapp", methods=["POST"])
def whatsapp():
    incoming_msg = request.values.get("Body", "").strip()
    resp = MessagingResponse()
    msg = resp.message()

    if incoming_msg.lower() == "hello":
        msg.body("Hi! How can I help you today?")
    elif incoming_msg.lower() == "bye":
        msg.body("Goodbye! Have a great day.")
    else:
        msg.body("Sorry, I didn't understand that. Try saying 'hello' or 'bye'.")

    return str(resp)


if __name__ == "__main__":
    app.run(debug=True)
