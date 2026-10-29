-- =====================================================================
-- Migração 001: campos do estilo Olympus, páginas dos capítulos e admin
-- ---------------------------------------------------------------------
-- O que faz (só ADICIONA, não apaga nem altera nenhum dado existente):
--   mangas    + tipo, destaque, visualizacoes, criado_em, atualizado_em
--   capitulos + visualizacoes, criado_em
--   nova tabela paginas  (imagens de cada capítulo, para o leitor)
--   nova tabela usuarios (administradores; só guarda o hash da senha)
--
-- Pode ser executada mais de uma vez sem erro: cada coluna só é criada
-- se ainda não existir.
--
-- Como rodar no MySQL Workbench: abra a conexão do banco, File > Open SQL
-- Script, escolha este arquivo e clique no raio (Execute) ou Ctrl+Shift+Enter.
-- =====================================================================

USE biblioteca_mangas;
SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS migracao_adicionar_coluna;

DELIMITER $$
CREATE PROCEDURE migracao_adicionar_coluna(
    IN nome_tabela VARCHAR(64),
    IN nome_coluna VARCHAR(64),
    IN definicao VARCHAR(255)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = nome_tabela
          AND COLUMN_NAME = nome_coluna
    ) THEN
        SET @comando = CONCAT('ALTER TABLE `', nome_tabela, '` ADD COLUMN `', nome_coluna, '` ', definicao);
        PREPARE instrucao FROM @comando;
        EXECUTE instrucao;
        DEALLOCATE PREPARE instrucao;
    END IF;
END$$
DELIMITER ;

-- Mangás
CALL migracao_adicionar_coluna('mangas', 'tipo', "VARCHAR(20) NOT NULL DEFAULT 'mangá'");
CALL migracao_adicionar_coluna('mangas', 'destaque', 'BOOLEAN NOT NULL DEFAULT FALSE');
CALL migracao_adicionar_coluna('mangas', 'visualizacoes', 'INT NOT NULL DEFAULT 0');
CALL migracao_adicionar_coluna('mangas', 'criado_em', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
CALL migracao_adicionar_coluna('mangas', 'atualizado_em', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');

-- Capítulos
CALL migracao_adicionar_coluna('capitulos', 'visualizacoes', 'INT NOT NULL DEFAULT 0');
CALL migracao_adicionar_coluna('capitulos', 'criado_em', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');

DROP PROCEDURE IF EXISTS migracao_adicionar_coluna;

-- Páginas de cada capítulo (apagadas junto com o capítulo)
CREATE TABLE IF NOT EXISTS paginas (
    id INT NOT NULL AUTO_INCREMENT,
    ordem INT NOT NULL,
    imagem_url VARCHAR(500) NOT NULL,
    capitulo_id INT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_pagina_capitulo_ordem (capitulo_id, ordem),
    KEY ix_paginas_capitulo_id (capitulo_id),
    CONSTRAINT fk_paginas_capitulo FOREIGN KEY (capitulo_id)
        REFERENCES capitulos (id) ON DELETE CASCADE
);

-- Administradores (a senha NUNCA é salva, só o hash bcrypt)
CREATE TABLE IF NOT EXISTS usuarios (
    id INT NOT NULL AUTO_INCREMENT,
    usuario VARCHAR(50) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_usuarios_usuario (usuario)
);

-- Conferência: deve listar as colunas novas
SELECT TABLE_NAME AS tabela, COLUMN_NAME AS coluna, COLUMN_TYPE AS tipo
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('mangas', 'capitulos', 'paginas', 'usuarios')
ORDER BY TABLE_NAME, ORDINAL_POSITION;
