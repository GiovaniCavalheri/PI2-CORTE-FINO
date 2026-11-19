const express = require("express");
const cookieParser = require("cookie-parser");
const router = require("./routes/routes");

const server = express();
const PORT = process.env.PORT || 5000;
server.set("view engine", "ejs");
server.set("views", "./views");
server.use(express.static("public"));

server.use(express.urlencoded({ extended: true }));
server.use(express.json());
//chave que assina o cookie do fornecedor logado (troque em producao)
server.use(cookieParser(process.env.COOKIE_SECRET || "corte-fino-chave-dev"));
server.use(router);

server.listen(PORT, () => {
  console.log(`Servidor rodando: http://localhost:${PORT}`);
});
