-- =====================================================================
-- Migração 003: crédito da tradução em cada capítulo
-- ---------------------------------------------------------------------
-- capitulos + traducao_por (nome de quem traduziu) e traducao_url (link)
--
-- A API já cria essas colunas sozinha ao iniciar (app/core/migracoes.py);
-- este script é para quem preferir rodar à mão. Pode ser executado mais
-- de uma vez sem erro.
-- =====================================================================

USE biblioteca_mangas;
SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS migracao_003;

DELIMITER $$
CREATE PROCEDURE migracao_003()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'capitulos' AND COLUMN_NAME = 'traducao_por'
    ) THEN
        ALTER TABLE capitulos ADD COLUMN traducao_por VARCHAR(100) NULL;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'capitulos' AND COLUMN_NAME = 'traducao_url'
    ) THEN
        ALTER TABLE capitulos ADD COLUMN traducao_url VARCHAR(500) NULL;
    END IF;
END$$
DELIMITER ;

CALL migracao_003();
DROP PROCEDURE IF EXISTS migracao_003;
