-- Alteracoes de estrutura do banco, em ordem. Rode as que ainda nao
-- foram aplicadas no seu banco.

-- 2026-11-19: data de validade do produto (opcional).
-- Produtos que tem lotes tambem mostram a validade do lote mais proximo
-- de vencer (LOTE.ID_PRODUTO ja liga o lote ao produto).
alter table PRODUTOS add column DATA_VALIDADE date null after QNT_ESTOQUE;
