import { sendMessage } from "../component/sendMessage.js";
import PQueue from "p-queue";
import PhoneID from "../libraries/FromatPhone.js";
import { v4 as uuidv4 } from "uuid";
import logger from "../libraries/logger.js";
import winston from "winston";

let messageList = [];
const messageStatus = {}; // Object to store the status of messages
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
    const messageLengthInBytes = Buffer.byteLength(message, "utf-8");
    if (messageLengthInBytes > 500) {
      // Jika panjang message dalam byte melebihi 500 byte, kirim respons dengan pesan error
      return res.status(400).json({
        status: "error",
        message: "Message cannot exceed 500 character",
      });
    }
    recipient = PhoneID(recipient);
    const messageId = uuidv4(); // Generate a unique ID for the message
    // Tambahkan pesan ke dalam array pesan
    // messageList.push({ recipient, message });
    messageList.push({ id: messageId, recipient, message });
    // console.log(messageList);
    messageStatus[messageId] = {
      status: "queued",
      // position: messageList.length,
      message: message,
    };
    res.json({
      status: "success",
      message: `Your message is entered in the queue.`,
      messageId,
    });
    //
    messageQueue.add(async () => {
      const { id, recipient, message } = messageList.shift(); // Ambil pesan pertama dari array
      messageStatus[id].status = "sending";

      const sendResult = await sendMessage(recipient, message);

      if (sendResult.status === "success") {
        messageStatus[id].status = "sent";
        messageStatus[id].message = message;
        logger.info(`Message success id: ${messageId}`, {
          sentStatus: "sent",
          recipient: recipient,
          message: message,
        });
      } else {
        messageStatus[id].status = "failed";
        messageStatus[id].error = sendResult.message;
        logger.error(`Failed to send message: ${messageId}`, {
          sentStatus: "failed",
          recipient: recipient,
          message: message,
        });
      }
    });
  }

  async checkStatus(req, res) {
    const { messageId } = req.params;
    const status = messageStatus[messageId];
    if (status) {
      res.json({
        status: "success",
        messageStatus: status,
      });

      // if (status.status === "failed") {

      // }
    } else {
      res.status(404).json({
        status: "error",
        message: "Message not found",
      });
    }
  }
}

export default new OneSend();
