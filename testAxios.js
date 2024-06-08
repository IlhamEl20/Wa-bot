import axios from "axios";

async function sendMessage() {
  try {
    const response = await axios.post(
      "http://localhost:3000/send-message",
      {
        recipient: "081279407408245",
        message: "message 1",
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const data = response.data;

    if (data.status === "success") {
      const messageId = data.messageId;
      checkMessageStatus(messageId);
    } else {
      console.error(data.message);
    }
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

async function checkMessageStatus(messageId) {
  try {
    let statusResponse;
    do {
      statusResponse = await axios.get(
        `http://localhost:3000/message-status/${messageId}`
      );
      const statusData = statusResponse.data;

      if (statusData.status === "success") {
        console.log(`Message status: ${statusData.messageStatus.status}`);
        if (
          statusData.messageStatus.status === "sent" ||
          statusData.messageStatus.status === "failed"
        ) {
          break;
        }
      } else {
        console.error(statusData.message);
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 5000)); // Polling setiap 5 detik
    } while (true);
  } catch (error) {
    console.error("Error checking message status:", error);
  }
}

sendMessage();
