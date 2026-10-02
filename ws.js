const { Server } = require("socket.io");

const io = new Server(3001, {
  cors: {
    origin: "*",
  },
});

console.log("WebSocket Server running on ws://localhost:3001");

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join_trade", (tradeId) => {
    socket.join(`trade_${tradeId}`);
    console.log(`Socket ${socket.id} joined trade_${tradeId}`);
  });

  socket.on("trade_updated", (data) => {
    console.log("Trade updated:", data);
    socket.to(`trade_${data.tradeId}`).emit("trade_updated", data);
  });
  
  socket.on("chat_message", (data) => {
    console.log("Chat message:", data);
    socket.to(`trade_${data.tradeId}`).emit("chat_message", data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});
