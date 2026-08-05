const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Versão 2");
});

app.listen(3000, "0.0.0.0", () => {
  console.log("App rodando na porta 3000");
});
