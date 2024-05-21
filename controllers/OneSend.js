import { sendMessage } from "../component/sendMessage.js";
import PQueue from "p-queue";
import PhoneID from "../libraries/FromatPhone.js";

let messageList = [];
const messageQueue = new PQueue({ concurrency: 1 });

class OneSend {
  async store(req, res) {
    let { recipient, message } = req.body;
    if (!recipient || !message) {
      // Jika ada data yang tidak lengkap, kirim respons dengan pesan error
      return res.status(400).json({
        status: "error",
        message: "Recipient and message are required",
      });
    }
    recipient = PhoneID(recipient);
    // Tambahkan pesan ke dalam array pesan
    messageList.push({ recipient, message });
    console.log(messageList);
    // Kirim pesan ke dalam antrian
    const sendResult = await messageQueue.add(() => {
      const { recipient, message } = messageList.shift(); // Ambil pesan pertama dari array
      return sendMessage(recipient, message);
    });

    if (sendResult.status === "success") {
      return res.json({
        status: "success",
        // message: "Message added to the queue",
        sendResult: sendResult, // Jika perlu, kirim informasi hasil pengiriman pesan ke klien
      });
    } else {
      // Jika terjadi kesalahan saat mengirim pesan, kirim pesan error ke klien
      return res.status(400).json({
        status: "error",
        message: sendResult.message,
      });
    }
  }
}

export default new OneSend();
