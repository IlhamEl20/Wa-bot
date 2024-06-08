import axios from "axios";

const messages = [
  {
    message: "Semangat menjalani masa masa dah la cape!",
    recipient: "083165874645",
  },
  {
    message: "Jangan menyerah dan tetap semangat!",
    recipient: "08127120280",
  },
  {
    message: "Hari ini adalah hari yang luar biasa!",
    recipient: "081279407408",
  },
  {
    message: "Terus berjuang dan jangan pernah putus asa!",
    recipient: "081273200357",
  },
];

const url = "http://localhost:3000/send-message";

async function postMessages() {
  for (const message of messages) {
    try {
      const response = await axios.post(url, message, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log("Message sent:", response.data);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }
}

postMessages();
