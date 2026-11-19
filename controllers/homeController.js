const Promocao = require("../models/promocaoModel");

class HomeController {
  indexView(req, res) {
    res.render("index");
  }

  aboutView(req, res) {
    res.render("about");
  }

  servicesView(req, res) {
    res.render("services");
  }

  contactView(req, res) {
    res.render("contact");
  }

  //ofertas = produtos com promocao em vigor (vem do banco)
  async offersView(req, res) {
    let ofertas = await new Promocao().listarOfertas();
    res.render("offers", { ofertas: ofertas });
  }

  signaturesView(req, res) {
    res.render("signatures");
  }

  joinView(req, res) {
    res.render("join");
  }

  cartView(req, res) {
    res.render("cart");
  }

  cadastroView(req, res) {
    res.render("cadastro");
  }

  admView(req, res) {
    res.render("adm");
  }
}

module.exports = HomeController;
