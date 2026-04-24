module.exports = (io) => {

  io.on("connection",(socket)=>{

    console.log("User connected:",socket.id);

    socket.on("join-session",(code)=>{
      socket.join(code);
    });

    socket.on("submit-answer",(data)=>{
      io.to(data.sessionCode).emit("new-vote",data);
    });

    socket.on("next-question",(code)=>{
      io.to(code).emit("question-changed");
    });

    socket.on("end-session",(code)=>{
      io.to(code).emit("session-ended");
    });

  });

};