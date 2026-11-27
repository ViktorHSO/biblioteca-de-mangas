-- =====================================================================
-- Migração 002: título e sinopse em português, inglês e espanhol
-- ---------------------------------------------------------------------
-- O que faz (só ADICIONA, não apaga nem altera texto existente):
--   mangas + idioma_original  (idioma em que título e sinopse foram escritos)
--   nova tabela manga_traducoes (título e sinopse nos outros idiomas)
--
-- Os mangás já cadastrados estão em espanhol, então ficam marcados com
-- idioma_original = 'es'. Se algum estiver em outro idioma, corrija pelo
-- formulário de edição do site (campo "Idioma original").
--
-- Os gêneros não precisam de migração: são traduzidos automaticamente
-- (veja backend/app/core/generos.py).
--
-- Pode ser executada mais de uma vez sem erro.
--
-- Como rodar no MySQL Workbench: abra a conexão do banco, File > Open SQL
-- Script, escolha este arquivo e clique no raio (Execute) ou Ctrl+Shift+Enter.
-- =====================================================================

USE biblioteca_mangas;
SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS migracao_002;

DELIMITER $$
CREATE PROCEDURE migracao_002()
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'mangas'
          AND COLUMN_NAME = 'idioma_original'
    ) THEN
        ALTER TABLE mangas ADD COLUMN idioma_original VARCHAR(5) NOT NULL DEFAULT 'pt';
        -- Só na primeira execução: os mangás existentes foram cadastrados em espanhol.
        UPDATE mangas SET idioma_original = 'es';
    END IF;
END$$
DELIMITER ;

CALL migracao_002();
DROP PROCEDURE IF EXISTS migracao_002;

-- Traduções (apagadas junto com o mangá)
CREATE TABLE IF NOT EXISTS manga_traducoes (
    id INT NOT NULL AUTO_INCREMENT,
    idioma VARCHAR(5) NOT NULL,
    titulo VARCHAR(255) NULL,
    sinopse TEXT NULL,
    manga_id INT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_traducao_manga_idioma (manga_id, idioma),
    KEY ix_manga_traducoes_manga_id (manga_id),
    CONSTRAINT fk_manga_traducoes_manga FOREIGN KEY (manga_id)
        REFERENCES mangas (id) ON DELETE CASCADE
);

-- Conferência
SELECT id, titulo, idioma_original FROM mangas ORDER BY id;
